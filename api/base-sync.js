// BASE→自前ショップ 全自動同期  /api/base-sync
// 公開+非公開(PW:5555)の商品を取得し、salon:data の eshop.products に直接保存する。
// Vercel cron で毎日自動実行。手動編集(🔒PW変更・非表示・説明文)は保持される。
const PUB = 'https://vi5.shopselect.net';
const SEC = 'https://vi5beauty.base.shop';
const SECRET_PW = '5555';
const SUPA_URL = 'https://tehcaufdztgpbrknpshk.supabase.co';
const SUPA_KEY = 'sb_publishable_CnOCyO9QU69K47vbbLRkYg__cEv53CJ';

function classify(name){const n=String(name||'');
  const R=[[/UV|日焼|サンスクリーン|BBクリーム/i,'UV対策'],
  [/シャンプー|トリートメント|ヘアオイル|ヘアミルク|頭皮|スカルプ|ヘアケア|つるりん/i,'ヘアケア'],
  [/ドライヤー|アイロン|美顔器|脱毛|MYTREX|マイトレックス|ヤーマン|KINUJO|絹女|リフト|EMS|スチーマー|ブラシ/i,'美容機器'],
  [/ファンデ|リップ|アイシャドウ|アイライナー|マスカラ|チーク|コンシーラー|下地|パウダー|メイク/i,'メイク'],
  [/サプリ|酵素|ファスティング|プロテイン|茶|ドリンク|インナー|エステプロ|Esthe Pro|ハーブ/i,'インナーケア'],
  [/フェム|デリケート/i,'フェムケア'],
  [/チケット|ギフト|回数券/i,'ギフト・チケット'],
  [/化粧水|美容液|クリーム|乳液|パック|洗顔|クレンジング|セラム|ローション|エッセンス|スキンケア|石けん|石鹸|ソープ|ミスト|V3|エクソソーム/i,'スキンケア']];
  for(const[r,c]of R)if(r.test(n))return c;return 'その他';}
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
    if (!name) { const t2 = seg.match(/class="[^"]*(?:item|product)[^"]*(?:name|title|ttl)[^"]*"[^>]*>\s*([^<]{2,120})/); if (t2) name = dec(t2[1].trim()); }
    if (!name) { const t3 = seg.match(/\/items\/\d+"[^>]*>\s*([^<]{2,120})\s*</); if (t3 && !/^\s*$/.test(t3[1])) name = dec(t3[1].trim()); }
    let pr = seg.match(/[¥￥]\s?([\d,]{2,9})/);
    if (!pr) pr = seg.match(/([\d,]{3,9})\s*円/);
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
async function collectPages(baseUrl, headers, secret, maxPages) {
  const items = [];
  const sep = baseUrl.indexOf('?') >= 0 ? '&' : '?';
  for (let p = 1; p <= (maxPages || 60); p++) {
    const r = await fx(baseUrl + sep + 'page=' + p, headers);
    if (!r.text) break;
    const got = parseList(r.text, baseUrl.split('/').slice(0,3).join('/'), secret);
    let added = 0;
    for (const it of got) if (!items.some(x => x.baseId === it.baseId)) { items.push(it); added++; }
    if (!added) break; // 新しい商品が出なくなったら終わり（ページ送り表記に依存しない）
  }
  return items;
}
async function catList(origin, headers) {
  const r = await fx(origin + '/', headers);
  const cats = []; const re = /href="(?:https?:\/\/[^"]*)?\/categories\/(\d+)[^"]*"[^>]*>\s*([^<]{1,60}?)\s*</g; let m;
  while ((m = re.exec(r.text))) {
    const name = dec(m[2]).replace(/\s+/g, ' ').trim();
    if (!name || /すべて|ALL\s*ITEM|一覧|^>|^</i.test(name)) continue;
    if (!cats.some(c => c.id === m[1])) cats.push({ id: m[1], name });
  }
  return cats;
}
async function pool(arr, n, fn) {
  const q = arr.slice(); const ws = [];
  for (let i = 0; i < n; i++) ws.push((async () => { while (q.length) { const x = q.shift(); try { await fn(x); } catch (e) {} } })());
  await Promise.all(ws);
}
async function collectShop(origin, headers, secret) {
  const catMap = {};
  try {
    const cats = await catList(origin, headers);
    await pool(cats, 8, async (c) => {
      const its = await collectPages(origin + '/categories/' + c.id, headers, secret, 15);
      for (const it of its) if (!catMap[it.baseId]) catMap[it.baseId] = { name: c.name, item: it };
    });
  } catch (e) {}
  const all = await collectPages(origin + '/items/all', headers, secret, 60);
  // カテゴリページにしか出ない商品も合流
  for (const id in catMap) if (!all.some(x => x.baseId === id)) all.push(catMap[id].item);
  for (const it of all) it.baseCat = catMap[it.baseId] ? catMap[it.baseId].name : '';
  return all;
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
    const pub = await collectShop(PUB, null, false);
    let sec = [], secErr = '';
    try {
      const ck = await secretCookie();
      sec = await collectShop(SEC, { Cookie: ck }, true);
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
      if (ex) { if (it.name) ex.name = it.name; if (it.price) ex.price = it.price; if (it.img) ex.img = it.img; ex.url = it.url; if (!ex.catManual) { if (it.baseCat) ex.cat = it.baseCat; else if (!ex.cat) ex.cat = it.secret ? '限定' : classify(it.name); } updated++; }
      else { d.eshop.products.push({ id: 'ep' + it.baseId, baseId: it.baseId, name: it.name, price: it.price, img: it.img, url: it.url, cat: it.baseCat || (it.secret ? '限定' : classify(it.name)), pw: it.secret ? SECRET_PW : '' }); added++; }
    }
    d.eshop.syncedAt = Date.now();
    if (added || updated) await saveData(d);
    res.status(200).json({ ok: true, public: pub.length, secret: sec.length, added, updated, secretError: secErr || undefined });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e && e.message) });
  }
};
