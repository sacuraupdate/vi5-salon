// BASE→自前ショップ 全自動同期 v3  /api/base-sync
// sitemap.xml から全商品IDを取得し、各商品ページから 名前/価格/画像/カテゴリ/説明 を正確に読む。
// 再開可能（既取得はスキップ）・手動編集(pw/hide/desc/catManual)保持・実行結果を diag としてGitHubに記録。
const PUB = 'https://vi5.shopselect.net';
const SEC = 'https://vi5beauty.base.shop';
const SECRET_PW = '5555';
const SUPA_URL = 'https://tehcaufdztgpbrknpshk.supabase.co';
const SUPA_KEY = 'sb_publishable_CnOCyO9QU69K47vbbLRkYg__cEv53CJ';
const UA = { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15' };

function dec(s){return String(s||'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#0?39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#\d+;/g,'');}
function strip(s){return dec(String(s||'').replace(/<[^>]*>/g,' ')).replace(/\s+/g,' ').trim();}
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
async function fx(url, headers) {
  const r = await fetch(url, { headers: Object.assign({}, UA, headers || {}), redirect: 'manual' });
  const cookies = (r.headers.getSetCookie ? r.headers.getSetCookie() : []).map(c => c.split(';')[0]);
  const text = (r.status >= 300 && r.status < 400) ? '' : await r.text();
  return { text, cookies, loc: r.headers.get('location'), status: r.status };
}
async function secretCookie(diag) {
  const jar = [];
  const addCk = cks => { for (const c of cks||[]) { const v=c.split(';')[0]; const k=v.split('=')[0]; const ix=jar.findIndex(x=>x.split('=')[0]===k); if(ix>=0)jar[ix]=v; else jar.push(v); } };
  // ゲート画面（トップ）を取得し、パスワードフォームを解読
  let gate = await fx(SEC + '/');
  addCk(gate.cookies);
  if (!gate.text && gate.loc) { gate = await fx(gate.loc.startsWith('http')?gate.loc:SEC+gate.loc, { Cookie: jar.join('; ') }); addCk(gate.cookies); }
  const html = gate.text || '';
  const pwIn = html.match(/<input[^>]*type=["']password["'][^>]*>/i);
  const formM = pwIn ? (() => { const i = html.indexOf(pwIn[0]); const fs = html.lastIndexOf('<form', i); const fe = html.indexOf('</form>', i); return fs>=0&&fe>i ? html.slice(fs, fe) : ''; })() : '';
  if (diag) diag.secForm = strip(formM).slice(0,200) + ' | inputs:' + [...formM.matchAll(/<input[^>]*name=["']([^"']+)["']/g)].map(m=>m[1]).join(',');
  if (!formM) { if (diag) diag.secGate = strip(html).slice(0, 160); throw new Error('pw form not found'); }
  const action = (formM.match(/action=["']([^"']*)["']/) || [,'/secret_ec/secret_ec_auths/login'])[1] || '/';
  const url = action.startsWith('http') ? action : SEC + (action.startsWith('/')?action:'/'+action);
  const body = new URLSearchParams();
  for (const m of formM.matchAll(/<input[^>]*>/g)) {
    const tag = m[0];
    const nm = (tag.match(/name=["']([^"']+)["']/) || [])[1]; if (!nm) continue;
    const tp = (tag.match(/type=["']([^"']+)["']/) || [,'text'])[1];
    const val = (tag.match(/value=["']([^"']*)["']/) || [,''])[1];
    body.set(nm, tp === 'password' ? SECRET_PW : dec(val));
  }
  const meta = html.match(/name=["']csrf-token["']\s+content=["']([^"']+)["']/);
  const r = await fetch(url, {
    method: 'POST', redirect: 'manual',
    headers: Object.assign({}, UA, { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': jar.join('; '), 'Referer': SEC + '/', 'Origin': SEC }, meta?{'X-CSRF-Token':meta[1]}:{}),
    body: body.toString()
  });
  addCk(r.headers.getSetCookie ? r.headers.getSetCookie() : []);
  if (diag) diag.secPost = r.status + '->' + (r.headers.get('location') || '');
  // リダイレクト先を1回踏んでセッション確立
  const loc = r.headers.get('location');
  if (loc) { const r2 = await fx(loc.startsWith('http')?loc:SEC+loc, { Cookie: jar.join('; ') }); addCk(r2.cookies); }
  return jar.join('; ');
}
async function idsFromSitemap(origin, headers) {
  const ids = new Set();
  try {
    const r = await fx(origin + '/sitemap.xml', headers);
    let m; const re = /\/items\/(\d+)/g;
    while ((m = re.exec(r.text))) ids.add(m[1]);
    // sitemapがindex形式なら子sitemapも
    const subs = [...r.text.matchAll(/<loc>([^<]*sitemap[^<]*)<\/loc>/g)].map(x => x[1]).slice(0, 5);
    for (const su of subs) {
      try { const r2 = await fx(su, headers); while ((m = re.exec(r2.text))) ids.add(m[1]); } catch (e) {}
    }
  } catch (e) {}
  return [...ids];
}
async function idsFromList(origin, headers) {
  const ids = new Set();
  for (let p = 1; p <= 60; p++) {
    const r = await fx(origin + '/items/all?page=' + p, headers);
    if (!r.text) break;
    let added = 0, m; const re = /\/items\/(\d+)/g;
    while ((m = re.exec(r.text))) { if (!ids.has(m[1])) { ids.add(m[1]); added++; } }
    if (!added) break;
  }
  return [...ids];
}
function parseItemPage(html, origin, id) {
  const name = strip((html.match(/property="og:title"\s+content="([^"]+)"/) || [])[1] || '').replace(/\s*[|｜].*$/, '');
  const img = dec((html.match(/property="og:image"\s+content="([^"]+)"/) || [])[1] || '');
  let price = 0;
  const ld = html.match(/"price"\s*:\s*"?([\d.]+)"?/); if (ld) price = Math.round(parseFloat(ld[1]));
  if (!price) { const p2 = html.match(/[¥￥]\s?([\d,]{2,9})/); if (p2) price = parseInt(p2[1].replace(/,/g, '')); }
  if (!price) { const p3 = html.match(/([\d,]{3,9})\s*円/); if (p3) price = parseInt(p3[1].replace(/,/g, '')); }
  let cat='';
  let desc = strip((html.match(/property="og:description"\s+content="([^"]+)"/) || [])[1] || '').slice(0, 140);
  const oos = /(売り切れ|SOLD\s*OUT|在庫切れ)/i.test(html);
  return { baseId: id, name, img, price, cat, desc, oos, url: origin + '/items/' + id };
}
async function catCatalog(origin, headers, sampleId) {
  // 全カテゴリ(ID+名前)を、任意の1ページのナビから抽出
  const tryPages = [origin + '/', sampleId ? origin + '/items/' + sampleId : null].filter(Boolean);
  const cats = [];
  for (const u of tryPages) {
    try {
      const r = await fx(u, headers);
      for (const m of r.text.matchAll(/<a[^>]*href="(?:https?:\/\/[^"]*)?\/categories\/(\d+)[^"]*"[^>]*>([\s\S]{0,150}?)<\/a>/g)) {
        const name = strip(m[2]); if (!name || name.length > 40) continue;
        if (!cats.some(c => c.id === m[1])) cats.push({ id: m[1], name });
      }
      if (cats.length >= 3) break;
    } catch (e) {}
  }
  return cats;
}
async function catMembership(origin, headers, cats, budgetUntil) {
  const map = {};
  await pool(cats, 4, async (c) => {
    await sleep(120);
    for (let p = 1; p <= 12; p++) {
      if (Date.now() > budgetUntil) return;
      const r = await fx(origin + '/categories/' + c.id + '?page=' + p, headers);
      if (!r.text) break;
      let added = 0;
      for (const m of r.text.matchAll(/\/items\/(\d+)/g)) { if (!map[m[1]]) { map[m[1]] = c.name; added++; } else if (map[m[1]] !== c.name) {} }
      if (!added) break;
    }
  });
  return map;
}
async function pool(arr, n, fn) {
  const q = arr.slice(); const ws = [];
  for (let i = 0; i < n; i++) ws.push((async () => { while (q.length) { const x = q.shift(); try { await fn(x); } catch (e) {} } })());
  await Promise.all(ws);
}
async function loadData() {
  const r = await fetch(SUPA_URL + '/rest/v1/kv?key=eq.salon:data&select=value', { headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY } });
  if (!r.ok) throw new Error('load-' + r.status);
  const j = await r.json(); if (!Array.isArray(j) || !j.length) return null;
  let v = j[0].value;
  for (let i = 0; i < 4; i++) { if (typeof v === 'string') { try { v = JSON.parse(v); continue; } catch (e) { break; } } if (Array.isArray(v)) { v = v[0]; continue; } break; }
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
async function writeDiag(diag) {
  try {
    await fetch(SUPA_URL + '/rest/v1/kv?on_conflict=key', {
      method: 'POST',
      headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ key: 'salon:diag', value: JSON.stringify(diag) })
    });
  } catch (e) {}
}
module.exports = async (req, res) => {
  const t0 = Date.now();
  const diag = { at: new Date().toISOString() };
  try {
    const d = await loadData();
    if (!d) { res.status(503).json({ ok: false, error: 'data unavailable' }); return; }
    d.eshop = d.eshop || {}; d.eshop.products = d.eshop.products || [];
    const known = {}; d.eshop.products.forEach(p => { if (p.baseId) known[p.baseId] = p; });

    // ---- 公開ショップ ----
    const smProbe = await fx(PUB + '/sitemap.xml');
    diag.smStatus = smProbe.status;
    let pubIds = [];
    { let m; const re=/\/items\/(\d+)/g; const seen=new Set(); while((m=re.exec(smProbe.text)))seen.add(m[1]); pubIds=[...seen]; }
    if (!pubIds.length) pubIds = await idsFromList(PUB);
    diag.pubIds = pubIds.length;
    if (!pubIds.length) diag.blocked = 'BASE側が一時ブロック中の可能性（時間をおいて自動回復します）';

    // ---- 非公開ショップ ----
    let secIds = [], ck = '', secErr = '';
    try {
      ck = await secretCookie(diag);
      secIds = await idsFromSitemap(SEC, { Cookie: ck });
      if (!secIds.length) secIds = await idsFromList(SEC, { Cookie: ck });
      if (!secIds.length) secErr = 'secret: no items (login failed?)';
    } catch (e) { secErr = 'secret: ' + String(e && e.message); }
    diag.secIds = secIds.length; diag.secErr = secErr;

    // ---- 本物のカテゴリ所属マップ ----
    const pubCats = await catCatalog(PUB, null, pubIds[0]);
    diag.pubCats = pubCats.map(c => c.name);
    const pubMap = await catMembership(PUB, null, pubCats, t0 + 30000);
    diag.pubMapped = Object.keys(pubMap).length;
    let secMap = {};
    if (secIds.length) { try { const secCats = await catCatalog(SEC, { Cookie: ck }, secIds[0]); secMap = await catMembership(SEC, { Cookie: ck }, secCats, t0 + 40000); } catch (e) {} }

    const jobs = [];
    for (const id of pubIds) { const k = known[id]; if (!(k && k.name && k.cat && k.price)) jobs.push({ id, secret: false }); }
    for (const id of secIds) { const k = known[id]; if (!(k && k.name && k.price)) jobs.push({ id, secret: true }); }
    diag.jobs = jobs.length;

    let added = 0, updated = 0, fetched = 0;
    await pool(jobs, 4, async (job) => {
      await sleep(150);
      if (Date.now() - t0 > 45000) return; // 時間内で打ち切り→次回続きから
      const origin = job.secret ? SEC : PUB;
      const r = await fx(origin + '/items/' + job.id, job.secret ? { Cookie: ck } : null);
      if (!r.text) return;
      const it = parseItemPage(r.text, origin, job.id);
      if (!it.name && !it.img) return;
      fetched++;
      const ex = known[job.id];
      if (ex) {
        if (it.name) ex.name = it.name; if (it.price) ex.price = it.price; if (it.img) ex.img = it.img;
        if (!ex.desc && it.desc) ex.desc = it.desc; ex.oos = it.oos; ex.url = it.url;

        updated++;
      } else {
        const np = { id: 'ep' + job.id, baseId: job.id, name: it.name, price: it.price, img: it.img, desc: it.desc, oos: it.oos, url: it.url,
          cat: '', pw: job.secret ? SECRET_PW : '' };
        d.eshop.products.push(np); known[job.id] = np; added++;
      }
    });
    // 全商品にカテゴリ適用（手動設定は保持・マップが取れた時だけ／取れていない時は現状維持）
    let recat = 0;
    const pubCnt=d.eshop.products.filter(p=>!p.pw).length;const pubOk = Object.keys(pubMap).length >= Math.min(10, Math.max(2, Math.ceil(pubCnt*0.3)));
    const secOk = Object.keys(secMap).length >= 1;
    for (const p of d.eshop.products) {
      if (p.catManual) continue;
      if (p.pw) { if (secOk && secMap[p.baseId] && p.cat !== secMap[p.baseId]) { p.cat = secMap[p.baseId]; recat++; } }
      else if (pubOk) { const nc = pubMap[p.baseId] || 'その他'; if (p.cat !== nc) { p.cat = nc; recat++; } }
    }
    diag.recat = recat; diag.pubOk = pubOk;
    d.eshop.syncedAt = Date.now();
    if (added || updated || recat) await saveData(d);
    diag.added = added; diag.updated = updated; diag.fetched = fetched;
    diag.total = d.eshop.products.length;
    diag.cats = [...new Set(d.eshop.products.map(p => p.cat).filter(Boolean))];
    diag.sample = d.eshop.products.slice(0, 5).map(p => p.name + '/' + p.price + '/' + p.cat);
    diag.ms = Date.now() - t0;
    await writeDiag(diag);
    res.status(200).json(Object.assign({ ok: true, remaining: Math.max(0, jobs.length - fetched) }, diag));
  } catch (e) {
    diag.error = String(e && e.message); diag.ms = Date.now() - t0;
    await writeDiag(diag);
    res.status(500).json({ ok: false, error: diag.error });
  }
};
