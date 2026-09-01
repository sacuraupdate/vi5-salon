// BASE商品インポート  /api/base-import?shop=public|secret&page=1&pw=xxxx
// 公開: vi5.shopselect.net / 非公開: vi5beauty.base.shop（パスワードでログインして取得）
const PUB = 'https://vi5.shopselect.net';
const SEC = 'https://vi5beauty.base.shop';

function parseList(html, origin) {
  const out = [];
  // 商品リンクごとのブロックを切り出して name/price/img を拾う
  const re = /href="(?:https?:\/\/[^"]*)?\/items\/(\d+)"/g;
  const ids = [];
  let m;
  while ((m = re.exec(html))) { if (!ids.includes(m[1])) ids.push(m[1]); }
  for (const id of ids) {
    const pos = html.indexOf('/items/' + id);
    const seg = html.slice(pos, pos + 1800);const segB = html.slice(Math.max(0, pos - 400), pos);
    const img = (seg.match(/https:\/\/baseec-img-mng\.akamaized\.net\/images\/item\/[^"'\s\\]+/) || [''])[0]
      .replace(/&amp;/g, '&');
    let name = '';
    const alt = seg.match(/alt="([^"]{2,80})"/);
    if (alt) name = alt[1];
    if (!name) { const t = seg.match(/title="([^"]{2,80})"/); if (t) name = t[1]; }
    const pr = seg.match(/[¥￥]\s?([\d,]{2,9})/);
    const price = pr ? parseInt(pr[1].replace(/,/g, '')) : 0;
    if (!out.some(x => x.baseId === id)) out.push({ baseId: id, name: name, price: price, img: img, url: origin + '/items/' + id });
  }
  return out;
}
function decodeEntities(s){return String(s||'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');}

async function fetchText(url, headers) {
  const r = await fetch(url, { headers: Object.assign({ 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' }, headers || {}), redirect: 'manual' });
  const cookies = [];
  const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
  for (const c of sc) cookies.push(c.split(';')[0]);
  const loc = r.headers.get('location');
  const text = (r.status >= 300 && r.status < 400) ? '' : await r.text();
  return { text, cookies, loc, status: r.status };
}

async function secretSession(pw) {
  // ログインページ→トークン取得→POST→セッションcookie
  const jar = [];
  const lp = await fetchText(SEC + '/secret_ec/secret_ec_auths/login');
  jar.push(...lp.cookies);
  const tok = (lp.text.match(/name="authenticity_token"[^>]*value="([^"]+)"/) || lp.text.match(/name="csrf-token"\s+content="([^"]+)"/) || [])[1] || '';
  const pwField = (lp.text.match(/name="(secret_ec_auth\[password\]|password)"/) || [, 'password'])[1];
  const body = new URLSearchParams();
  if (tok) body.set('authenticity_token', tok);
  body.set(pwField, pw);
  const r = await fetch(SEC + '/secret_ec/secret_ec_auths/login', {
    method: 'POST', redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': jar.join('; '), 'User-Agent': 'Mozilla/5.0', 'Referer': SEC + '/secret_ec/secret_ec_auths/login' },
    body: body.toString()
  });
  const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
  for (const c of sc) { const v = c.split(';')[0]; const k = v.split('=')[0]; const ix = jar.findIndex(x => x.split('=')[0] === k); if (ix >= 0) jar[ix] = v; else jar.push(v); }
  return jar.join('; ');
}

module.exports = async (req, res) => {
  try {
    const q = req.query || {};
    const shop = q.shop === 'secret' ? 'secret' : 'public';
    const page = parseInt(q.page || '1') || 1;
    if (shop === 'public') {
      const r = await fetchText(PUB + '/items/all?page=' + page);
      const items = parseList(decodeEntities(r.text), PUB).map(x => Object.assign(x, { secret: false }));
      const hasNext = r.text.indexOf('page=' + (page + 1)) >= 0;
      res.status(200).json({ ok: true, shop, page, hasNext, items });
      return;
    }
    // secret
    const pw = q.pw || '';
    if (!pw) { res.status(400).json({ ok: false, error: 'pw required' }); return; }
    const cookie = await secretSession(pw);
    const r = await fetchText(SEC + '/items/all?page=' + page, { Cookie: cookie });
    if (r.status >= 300 && r.loc && r.loc.indexOf('login') >= 0) { res.status(200).json({ ok: false, error: 'login failed' }); return; }
    const items = parseList(decodeEntities(r.text), SEC).map(x => Object.assign(x, { secret: true }));
    const hasNext = r.text.indexOf('page=' + (page + 1)) >= 0;
    res.status(200).json({ ok: true, shop, page, hasNext, items });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e && e.message) });
  }
};
