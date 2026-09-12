const L=require('./_lib');
// AI文章整え  POST /api/ai  { text, mode }
// APIキーはサーバー側（Vercel環境変数 ANTHROPIC_API_KEY）に置く。フロントには出さない。
const SYS = {
  memo: 'あなたは美容サロンのアシスタントです。スタッフが音声でざっくり入力したカウンセリングのメモを、後から読み返せるよう簡潔に整理された日本語にまとめ直してください。事実のみ、絵文字は不要。短い箇条書きでも構いません。出力は本文のみ。',
  campaign: 'あなたは美容サロンの広報担当です。入力されたざっくりした内容を、お客様向けのお知らせ文に整えてください。必ず丁寧な敬語（です・ます調）で、2〜3文・適度に絵文字。上品な文体に。出力は本文のみ。',
  message: 'あなたは美容サロンのスタッフです。入力内容を、お客様にお送りする文章に整えてください。必ず丁寧な敬語（です・ます調）で、温かく上品な文体に。なれなれしい表現やタメ口は使わない。適度に絵文字を使い3〜4文程度。出力は本文のみ。'
};
module.exports=async(req,res)=>{L.noStore(res);const me=await L.authenticate(req).catch(()=>null);if(!me){res.status(401).json({ok:false,error:'unauth'});return;}
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }
  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    if (!body || typeof body !== 'object') {
      body = await new Promise(r => { let d = ''; req.on('data', c => d += c); req.on('end', () => { try { r(JSON.parse(d)); } catch (e) { r({}); } }); });
    }
    const text = (body.text || '').toString().slice(0, 4000);
    const mode = SYS[body.mode] ? body.mode : 'memo';
    if (!text.trim()) { res.status(400).json({ error: 'no text' }); return; }
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) { res.status(200).json({ ok: false, error: 'no-key', text: text }); return; }
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, system: SYS[mode], messages: [{ role: 'user', content: text }] })
    });
    const data = await r.json();
    const out = ((data.content || []).filter(x => x.type === 'text').map(x => x.text).join('') || '').trim();
    if (!out) { res.status(200).json({ ok: false, error: 'empty', text: text }); return; }
    res.status(200).json({ ok: true, text: out });
  } catch (e) {
    res.status(200).json({ ok: false, error: String(e && e.message), text: (req.body && req.body.text) || '' });
  }
};
