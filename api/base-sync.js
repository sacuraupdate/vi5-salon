// BASE→自前ショップ 全自動同期  /api/base-sync
// 公開+非公開(PW:5555)の商品を取得し、salon:data の eshop.products に直接保存する。
// Vercel cron で毎日自動実行。手動編集(🔒PW変更・非表示・説明文)は保持される。
const PUB = 'https://vi5.shopselect.net';
const SEC = 'https://vi5beauty.base.shop';
const SECRET_PW = '5555';
const SUPA_URL = 'https://tehcaufdztgpbrknpshk.supabase.co';
const SUPA_KEY = 'sb_publishable_CnOCyO9QU69K47vbbLRkYg__cEv53CJ';

function dec(s){return String(s||'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'");}
function parseList(html, origin, secret) {
  const out = [];
  const re = /href="(?:https?:\/\/[^"]*)?\/items\/(\d+)"/g;
  const ids = []; let m;
  while ((m = re.exec(html))) { if (!ids.includes(m[1])) ids.push(m[1]); }
  for (const id of ids) {
    const pos = html.indexOf('/items/' + id);
    const seg = html.slice(pos, pos + 1800);const segB = html.slice(Math.max(0, pos - 400), pos);
    let img = dec((seg.match(/https:\/\/baseec-img-mng\.akamaized\.net\/images\/item\/[^"'\s\\]+/) || [''])[0]);if(!img)img=dec((segB.match(/https:\/\/baseec-img-mng\.akamaized\.net\/images\/item\/[^"'\s\\]+/) || [''])[0]);
    let name = '';
    const alt = seg.match(/alt="([^"]{2,120})"/); if (alt) name = dec(alt[1]);
    if (!name) { const t = seg.match(/title="([^"]{2,120})"/); if (t) name = dec(t[1]); }
    const pr = seg.match(/[¥￥]\s?([\d,]{2,9})/);
    const price = pr ? parseInt(pr[1].replace(/,/g, '')) : 0;
    out.push({ baseId: id, name, price, img, url: origin + '/items/' + id, secret: !!secret });
  }
  return out;
}
async function fx(url, headers) {
  const r = await fetch(url, { headers: Object.assign({ 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' }, headers || {}), redirect: 'manual' });
  const cookies = (r.headers.getSetCookie ? r.headers.getSetCookie() : []).map(c => c.split(';')[0]);
  const text = (r.status >= 300 && r.status < 400) ? '' : await r.text();
  return { text, cookies, loc: r.headers.get('location'), status: r.status };
}
async function secretCookie() {
  const jar = [];
  const lp = await fx(SEC + '/secret_ec/secret_ec_auths/login');
  jar.push(...lp.cookies);
  const tok = (lp.text.match(/name="authenticity_token"[^>]*value="([^"]+)"/) || lp.text.match(/name="csrf-token"\s+content="([^"]+)"/) || [])[1] || '';
  const pwField = (lp.text.match(/name="(secret_ec_auth\[password\]|password)"/) || [, 'password'])[1];
  const body = new URLSearchParams();
  if (tok) body.set('authenticity_token', tok);
  body.set(pwField, SECRET_PW);
  const r = await fetch(SEC + '/secret_ec/secret_ec_auths/login', {
    method: 'POST', redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': jar.join('; '), 'User-Agent': 'Mozilla/5.0', 'Referer': SEC + '/secret_ec/secret_ec_auths/login' },
    body: body.toString()
  });
  for (const c of (r.headers.getSetCookie ? r.headers.getSetCookie() : [])) {
    const v = c.split(';')[0]; const k = v.split('=')[0];
    const ix = jar.findIndex(x => x.split('=')[0] === k);
    if (ix >= 0) jar[ix] = v; else jar.push(v);
  }
  return jar.join('; ');
}
async function collect(origin, headers, secret, maxPages) {
  const items = [];
  for (let p = 1; p <= (maxPages || 30); p++) {
    const r = await fx(origin + '/items/all?page=' + p, headers);
    if (!r.text) break;
    const got = parseList(r.text, origin, secret);
    let added = 0;
    for (const it of got) if (!items.some(x => x.baseId === it.baseId)) { items.push(it); added++; }
    if (!added || r.text.indexOf('page=' + (p + 1)) < 0) break;
  }
  return items;
}
async function loadData() {
  const r = await fetch(SUPA_URL + '/rest/v1/kv?key=eq.salon:data&select=value', { headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY } });
  if (!r.ok) throw new Error('load-' + r.status);
  const j = await r.json();
  if (!Array.isArray(j) || !j.length) return null;
  let v = j[0].value;
  for (let i = 0; i < 4; i++) {
    if (typeof v === 'string') { try { v = JSON.parse(v); continue; } catch (e) { break; } }
    if (Array.isArray(v)) { v = v[0]; continue; }
    break;
  }
  return (v && typeof v === 'object' && !Array.isArray(v)) ? v : null;
}
async function saveData(d) {
  const r = await fetch(SUPA_URL + '/rest/v1/kv?on_conflict=key', {
    method: 'POST',
    headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ key: 'salon:data', value: JSON.stringify(d) })
  });
  if (!r.ok) throw new Error('save-' + r.status);
}
module.exports = async (req, res) => {
  try {
    const pub = await collect(PUB, null, false, 30);
    let sec = [], secErr = '';
    try {
      const ck = await secretCookie();
      sec = await collect(SEC, { Cookie: ck }, true, 20);
      if (!sec.length) secErr = 'secret empty (login?)';
    } catch (e) { secErr = String(e && e.message); }
    const d = await loadData();
    if (!d) { res.status(503).json({ ok: false, error: 'data unavailable' }); return; }
    d.eshop = d.eshop || { products: [] };
    d.eshop.products = d.eshop.products || [];
    let added = 0, updated = 0;
    for (const it of pub.concat(sec)) {
      if (!it.name && !it.img) continue;
      const ex = d.eshop.products.find(p => p.baseId === it.baseId);
      if (ex) { if (it.name) ex.name = it.name; if (it.price) ex.price = it.price; if (it.img) ex.img = it.img; ex.url = it.url; updated++; }
      else { d.eshop.products.push({ id: 'ep' + it.baseId, baseId: it.baseId, name: it.name, price: it.price, img: it.img, url: it.url, cat: it.secret ? '限定' : '', pw: it.secret ? SECRET_PW : '' }); added++; }
    }
    d.eshop.syncedAt = Date.now();
    if (added || updated) await saveData(d);
    res.status(200).json({ ok: true, public: pub.length, secret: sec.length, added, updated, secretError: secErr || undefined });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e && e.message) });
  }
};
