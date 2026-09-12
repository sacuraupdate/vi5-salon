// Vi5 共通サーバーライブラリ（Vercel Functions 用）
// - Supabase へは Service Role Key でのみ接続（ブラウザには一切渡さない）
// - CAS 保存（RPC kv_cas_save → 更新行数=1 を検証。無ければ PATCH+return=representation で検証）
// - 認証：PBKDF2 パスワード / HMAC 署名 Cookie / sessionVersion 即時失効
// - Asia/Tokyo 固定の日時計算
'use strict';
const crypto = require('crypto');

const SUPA_URL = process.env.SUPABASE_URL || 'https://tehcaufdztgpbrknpshk.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const SESSION_SECRET = process.env.SESSION_SECRET || '';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://vi5-salon.vercel.app';
const COOKIE_NAME = 'vi5s';
const SESSION_DAYS = 30;

function must(v, name) { if (!v) throw Object.assign(new Error('missing env ' + name), { status: 500 }); return v; }
function H() { return { apikey: must(SERVICE_KEY, 'SUPABASE_SERVICE_KEY'), Authorization: 'Bearer ' + SERVICE_KEY, 'Content-Type': 'application/json' }; }

// ---------- JST ----------
const JST_OFFSET_MS = 9 * 3600 * 1000;
function jstNow() { return new Date(Date.now() + JST_OFFSET_MS); } // UTC表現だが JST の壁時計を持つ Date
function jstDateStr(d) { const x = d || jstNow(); return x.getUTCFullYear() + '-' + String(x.getUTCMonth() + 1).padStart(2, '0') + '-' + String(x.getUTCDate()).padStart(2, '0'); }
function jstMinutesOfDay(d) { const x = d || jstNow(); return x.getUTCHours() * 60 + x.getUTCMinutes(); }
function jstEpochOf(dateStr, minOfDay) { // "YYYY-MM-DD" + 分 → 実 epoch ms
  const [y, m, dd] = dateStr.split('-').map(Number); return Date.UTC(y, m - 1, dd, 0, 0, 0) - JST_OFFSET_MS + minOfDay * 60000; }
function jstDow(dateStr) { const [y, m, dd] = dateStr.split('-').map(Number); return new Date(Date.UTC(y, m - 1, dd)).getUTCDay(); }
function isDateStr(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s + 'T00:00:00Z')); }
function addDays(dateStr, n) { const t = Date.parse(dateStr + 'T00:00:00Z') + n * 86400000; return new Date(t).toISOString().slice(0, 10); }

// ---------- KV ----------
async function kvGetRow(key) {
  const r = await fetch(SUPA_URL + '/rest/v1/kv?key=eq.' + encodeURIComponent(key) + '&select=value,version', { headers: H() });
  if (!r.ok) throw Object.assign(new Error('kv-get-' + r.status), { status: 502 });
  const j = await r.json(); if (!Array.isArray(j) || !j.length) return null;
  let v = j[0].value; for (let i = 0; i < 4; i++) { if (typeof v === 'string') { try { v = JSON.parse(v); continue; } catch (e) { break; } } if (Array.isArray(v)) { v = v[0]; continue; } break; }
  return { value: (v && typeof v === 'object') ? v : null, version: Number(j[0].version || 0) };
}
async function kvGet(key) { const r = await kvGetRow(key); return r ? r.value : null; }

// 条件付き保存：expected と一致する行だけを更新し、更新行数が正確に1件のときだけ成功。
// 1) RPC kv_cas_save（原子的・推奨）  2) 無ければ PATCH ... version=eq.N + return=representation で行数検証
async function kvCasPut(key, value, expectedVersion) {
  const body = JSON.stringify(value);
  // 1) RPC
  try {
    const r = await fetch(SUPA_URL + '/rest/v1/rpc/kv_cas_save', { method: 'POST', headers: H(), body: JSON.stringify({ p_key: key, p_expected: expectedVersion, p_value: body }) });
    if (r.ok) { const j = await r.json(); const nv = Number(j); if (Number.isFinite(nv) && nv > expectedVersion) return { ok: true, version: nv }; return { ok: false, conflict: true }; }
    if (r.status !== 404) { /* RPC は存在するが失敗 */ const t = await r.text().catch(() => ''); if (!/function|rpc|kv_cas_save/i.test(t)) throw Object.assign(new Error('kv-rpc-' + r.status), { status: 502 }); }
  } catch (e) { if (e && e.status) throw e; /* RPC未作成 → フォールバック */ }
  // 2) PATCH フォールバック（version 条件付き・更新行を返させて件数確認）
  if (expectedVersion === 0) {
    // 行が無い場合は INSERT（重複は 409 → 競合扱い）
    const exists = await kvGetRow(key);
    if (!exists) {
      const r = await fetch(SUPA_URL + '/rest/v1/kv', { method: 'POST', headers: { ...H(), Prefer: 'return=representation' }, body: JSON.stringify({ key, value: body, version: 1 }) });
      if (r.status === 409) return { ok: false, conflict: true };
      if (!r.ok) throw Object.assign(new Error('kv-ins-' + r.status), { status: 502 });
      const j = await r.json(); return (Array.isArray(j) && j.length === 1) ? { ok: true, version: 1 } : { ok: false, conflict: true };
    }
  }
  const r = await fetch(SUPA_URL + '/rest/v1/kv?key=eq.' + encodeURIComponent(key) + '&version=eq.' + expectedVersion, { method: 'PATCH', headers: { ...H(), Prefer: 'return=representation' }, body: JSON.stringify({ value: body, version: expectedVersion + 1 }) });
  if (!r.ok) throw Object.assign(new Error('kv-cas-' + r.status), { status: 502 });
  const j = await r.json();
  if (Array.isArray(j) && j.length === 1) return { ok: true, version: expectedVersion + 1 };
  return { ok: false, conflict: true };
}

// 読込→mutate(merge)→CAS保存 を競合時に再試行
async function kvSaveWithRetry(key, mutate, maxTry) {
  let tries = 0, last = null;
  while (tries < (maxTry || 6)) {
    tries++;
    const row = await kvGetRow(key);
    const cur = row ? (row.value || {}) : {};
    const ver = row ? row.version : 0;
    const next = await mutate(cur, ver);
    if (next === null) return { ok: true, version: ver, skipped: true };
    const res = await kvCasPut(key, next, ver);
    if (res.ok) return { ok: true, version: res.version, tries };
    last = res; await new Promise(r => setTimeout(r, 40 * tries + Math.floor(Math.random() * 60)));
  }
  throw Object.assign(new Error('cas-conflict-exhausted'), { status: 409, detail: last });
}

// 一度だけ作る固定復旧ポイント（存在すれば絶対に上書きしない）
async function ensurePreRlsBackup() {
  const ex = await kvGetRow('salon:bak:pre-rls'); if (ex && ex.value) return false;
  const data = await kvGet('salon:data'); const work = await kvGet('salon:work'); const eshop = await kvGet('salon:eshop');
  const payload = { at: Date.now(), note: 'P0改修前の固定復旧ポイント', data, work, eshop };
  const res = await kvCasPut('salon:bak:pre-rls', payload, 0);
  return !!res.ok;
}

// ---------- パスワード / セッション（P0改修前と同じ「スタッフ専用の共通パスワード」方式。認証の輸送はCookie/署名/CASのまま維持） ----------
function b64u(s) { return Buffer.from(s).toString('base64url'); }
function signToken(payload) { const body = b64u(JSON.stringify(payload)); const sig = crypto.createHmac('sha256', must(SESSION_SECRET, 'SESSION_SECRET')).update(body).digest('base64url'); return body + '.' + sig; }
function verifyToken(tok) { if (!tok || tok.indexOf('.') < 0) return null; const [body, sig] = tok.split('.'); const exp = crypto.createHmac('sha256', must(SESSION_SECRET, 'SESSION_SECRET')).update(body).digest('base64url'); if (sig.length !== exp.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(exp))) return null; try { const p = JSON.parse(Buffer.from(body, 'base64url').toString()); if (!p || !p.exp || p.exp < Date.now()) return null; return p; } catch (e) { return null; } }
function parseCookies(req) { const h = req.headers.cookie || ''; const out = {}; h.split(';').forEach(p => { const i = p.indexOf('='); if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); }); return out; }
function setSessionCookie(res, token) { res.setHeader('Set-Cookie', COOKIE_NAME + '=' + encodeURIComponent(token) + '; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=' + (SESSION_DAYS * 86400)); }
function clearSessionCookie(res) { res.setHeader('Set-Cookie', COOKIE_NAME + '=; HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=0'); }

// 認証：署名と期限だけを検証する単純なCookieセッション（スタッフ個別アカウントは持たない）
async function authenticate(req) {
  const tok = parseCookies(req)[COOKIE_NAME]; const p = verifyToken(tok); if (!p || p.role !== 'staff') return null;
  return { staffId: 'shared', role: 'owner', mustChange: false };
}
function checkStaffPassword(pw) { const expected = process.env.STAFF_PASSWORD || ''; if (!expected) throw Object.assign(new Error('STAFF_PASSWORD not set'), { status: 500 }); if (String(pw || '').length !== expected.length) return false; try { return crypto.timingSafeEqual(Buffer.from(String(pw || '')), Buffer.from(expected)); } catch (e) { return false; } }
function requireOrigin(req) {
  const o = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : '');
  return o === ALLOWED_ORIGIN;
}
function noStore(res) { res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Pragma', 'no-cache'); }

// ---------- レート制限（kv 上のカウンタ・失敗時は fail-closed） ----------
async function rateLimit(bucket, limit, windowSec) {
  const key = 'salon:rl:' + bucket; const now = Date.now();
  let allowed = true;
  await kvSaveWithRetry(key, (cur) => {
    const c = cur && cur.until && cur.until > now ? cur : { until: now + windowSec * 1000, n: 0 };
    c.n = (c.n || 0) + 1; if (c.n > limit) allowed = false; return c;
  }, 4).catch(() => { allowed = false; });
  return allowed;
}

// ---------- 統合（クライアントから移植・サーバーが唯一の統合者） ----------
function tOf(x) { return Math.max((x && x._u) || 0, (x && x.editedAt) || 0, (x && x.at) || 0, 0); }
function mergeById(a, b, key, dead, timeFn) { const T = timeFn || tOf; const m = {}; (b || []).forEach(x => { if (x && x[key] != null && !(dead && dead.has(x[key]))) m[x[key]] = x; }); (a || []).forEach(x => { if (!x || x[key] == null || (dead && dead.has(x[key]))) return; const ex = m[x[key]]; if (!ex || T(x) >= T(ex)) m[x[key]] = x; }); return Object.values(m); }
function unionDel(a, b) { return [...new Set([...(a || []), ...(b || [])])].slice(-2000); }

function mergeData(d, srv) { // d=クライアント送信, srv=サーバー現在 → 統合結果
  d = d || {}; srv = srv || {};
  const out = Object.assign({}, srv);
  // 墓標
  ['delBookings', 'delServices', 'delStaff', 'delBoards', 'delAnnouncements'].forEach(k => { out[k] = unionDel(d[k], srv[k]); });
  out.deletedCust = Object.assign({}, srv.deletedCust || {}, d.deletedCust || {});
  // 予約
  const bkTime = b => Math.max(b.updatedAt || 0, b.cancelledAt || 0, b.editedAt || 0, b.visitedAt || 0, b.createdAt || 0, 0);
  out.bookings = mergeById(d.bookings, srv.bookings, 'id', new Set(out.delBookings), bkTime);
  // 顧客
  const cTime = c => Math.max((c && c._u) || 0, (c && c.updatedAt) || 0, 0);
  const L = d.customers || {}, S = srv.customers || {}; const merged = {};
  new Set([...Object.keys(S), ...Object.keys(L)]).forEach(k => {
    const a = L[k], b = S[k]; if (!a) { merged[k] = b; return; } if (!b) { merged[k] = a; return; }
    const base = (cTime(b) > cTime(a)) ? Object.assign({}, a, b) : Object.assign({}, b, a);
    // pointLog: ID 単位の union（件数比較は廃止）
    const pm = {}; [...(b.pointLog || []), ...(a.pointLog || [])].forEach(e => { if (!e) return; const id = e.id || ('legacy-' + k + '-' + (e.at || 0) + '-' + (e.pts || 0) + '-' + String(e.reason || '').slice(0, 20)); pm[id] = Object.assign({}, e, { id }); });
    base.pointLog = Object.values(pm).sort((x, y) => (y.at || 0) - (x.at || 0)).slice(0, 400);
    // bonusPoints は再計算しない（監査で 100% 一致を確認するまで）。新しい方の値を採用
    base.bonusPoints = (cTime(a) >= cTime(b)) ? a.bonusPoints : b.bonusPoints;
    const key = n => String(n && n.id || '') + '|' + String(n && n.date || '') + '|' + String(n && n.text || '').slice(0, 40);
    const map = {}; [...(b.notices || []), ...(a.notices || [])].forEach(n => { const kk = key(n); const ex = map[kk]; if (!ex) { map[kk] = n; return; } if (n.read && !ex.read) map[kk] = n; });
    base.notices = Object.values(map).sort((x, y) => String(y.date || '').localeCompare(String(x.date || '')));
    merged[k] = base;
  });
  for (const k in out.deletedCust) { if (out.deletedCust[k] && !L[k]) delete merged[k]; }
  out.customers = merged;
  // スタッフ・メニュー・クーポン（新しい方、同点は情報が多い方→サーバー）
  const rich = x => { let n = 0; ['photo', 'thumb', 'intro', 'quals', 'role', 'img', 'desc', 'detail'].forEach(k => { if (x && x[k]) n++; }); if (x && x.photos && x.photos.length) n += x.photos.length; if (x && x.prices && Object.keys(x.prices).length) n++; if (x && x.services && x.services.length) n++; if (x && x.wage) n++; return n; };
  const mrg = (a, b) => { const m = {}; (b || []).forEach(x => { if (x && x.id) m[x.id] = x; }); (a || []).forEach(x => { if (!x || !x.id) return; const ex = m[x.id]; if (!ex) { m[x.id] = x; return; } const ua = x._u || 0, ub = ex._u || 0; if (ua > ub) { m[x.id] = x; return; } if (ub > ua) return; if (rich(x) > rich(ex)) m[x.id] = x; }); return Object.values(m); };
  out.services = mrg(d.services, srv.services).filter(x => !new Set(out.delServices).has(x.id));
  out.staff = mrg(d.staff, srv.staff).filter(x => !new Set(out.delStaff).has(x.id));
  out.coupons = mrg(d.coupons, srv.coupons);
  // シフト（日付ごと新しい方・不明はサーバー）
  const mergeDated = (Lx, Sx) => { const o = {}; new Set([...Object.keys(Sx || {}), ...Object.keys(Lx || {})]).forEach(sid => { const Ss = (Sx || {})[sid] || {}, Ls = (Lx || {})[sid] || {}; const oo = {}; new Set([...Object.keys(Ss), ...Object.keys(Ls)]).forEach(ds => { const a = Ls[ds], b = Ss[ds]; if (!a) { oo[ds] = b; return; } if (!b) { oo[ds] = a; return; } const ua = (a && a._u) || 0, ub = (b && b._u) || 0; oo[ds] = ua > ub ? a : b; }); o[sid] = oo; }); return o; };
  out.shiftOverrides = mergeDated(d.shiftOverrides, srv.shiftOverrides);
  out.shifts = mergeDated(d.shifts, srv.shifts);
  // 掲示板・紹介・ブロック
  out.boards = mergeById(d.boards, srv.boards, 'id', new Set(out.delBoards));
  const idOrJson = x => (x && x.id) || JSON.stringify(x);
  ['referrals', 'blocks'].forEach(k => { const m = {}; (srv[k] || []).forEach(x => { m[idOrJson(x)] = x; }); (d[k] || []).forEach(x => { const id = idOrJson(x); const ex = m[id]; if (!ex || tOf(x) >= tOf(ex)) m[id] = x; }); out[k] = Object.values(m); });
  // チェックリスト（lastDone が新しい方）
  if (d.checklist || srv.checklist) { const c = JSON.parse(JSON.stringify(srv.checklist || d.checklist || {})); ['work', 'home'].forEach(mode => { const Lc = (d.checklist || {})[mode] || [], Sc = c[mode] || []; Lc.forEach((cat, ci) => { const sc = Sc[ci]; if (!sc) { Sc.push(cat); return; } (cat.items || []).forEach((it, ii) => { const si = sc.items[ii]; if (!si) { sc.items.push(it); return; } const la = it.lastDone || '', sa = si.lastDone || ''; if (la > sa || (la === sa && it.done && !si.done)) sc.items[ii] = it; }); }); c[mode] = Sc; }); if (d.checklist && d.checklist.date > (c.date || '')) c.date = d.checklist.date; out.checklist = c; }
  // 汎用セーフティネット
  const HANDLED = new Set(['customers', 'bookings', 'staff', 'services', 'shifts', 'shiftOverrides', 'boards', 'checklist', 'coupons', 'referrals', 'blocks', 'deletedCust', 'delBoards', 'delBookings', 'delServices', 'delStaff', 'delAnnouncements', '_seed']);
  Object.keys(d).forEach(k => {
    if (HANDLED.has(k) || k.indexOf('_') === 0) return;
    const S = srv[k], Lv = d[k]; if (Lv == null) return; if (S == null) { out[k] = Lv; return; }
    if (Array.isArray(S) && Array.isArray(Lv)) { const dead = new Set(out['del' + k.charAt(0).toUpperCase() + k.slice(1)] || []); const hasId = S.concat(Lv).some(x => x && x.id); if (hasId) out[k] = mergeById(Lv, S, 'id', dead); else if (Lv.length >= S.length) out[k] = Lv; return; }
    if (typeof S === 'object' && typeof Lv === 'object' && !Array.isArray(S) && !Array.isArray(Lv)) { out[k] = Object.assign({}, S, Lv); return; }
    out[k] = Lv;
  });
  delete out._seed; delete out.auth;
  return out;
}

function mergeWork(local, srv) {
  local = local || {}; srv = srv || {}; const out = Object.assign({}, srv);
  const delT = new Set(unionDel(local.delTasks, srv.delTasks)), delO = new Set(unionDel(local.delOrders, srv.delOrders)), delR = new Set(unionDel(local.delReports, srv.delReports)), delA = new Set(unionDel(local.delAlerts, srv.delAlerts)), delC = new Set(unionDel(local.delClock, srv.delClock));
  out.delTasks = [...delT]; out.delOrders = [...delO]; out.delReports = [...delR]; out.delAlerts = [...delA].slice(-500); out.delClock = [...delC];
  out.mutedAlerts = Object.assign({}, srv.mutedAlerts || {}, local.mutedAlerts || {});
  const tkTime = t => Math.max(t.doneAt || 0, t.editedAt || 0, t._u || 0, t.at || 0, 0);
  out.tasks = mergeById(local.tasks, srv.tasks, 'id', delT, tkTime);
  out.reports = mergeById(local.reports, srv.reports, 'id', delR, r => r.at || 0);
  out.orders = mergeById(local.orders, srv.orders, 'id', delO, o => Math.max(o.at || 0, o.statusAt || 0));
  out.ownerAlerts = mergeById(local.ownerAlerts, srv.ownerAlerts, 'id', delA, a => Math.max(a.readAt || 0, a._u || 0, a.at || 0, 0));
  out.clock = mergeById(local.clock, srv.clock, 'id', delC, c => Math.max(c._u || 0, c.approvedAt || 0, c.out || 0, c.in || 0, 0));
  out.events = mergeById(local.events, srv.events, 'id', null, e => Math.max(e._u || 0, e.at || 0, 0));
  // チャット：部屋ごとにIDで union（reads は和集合）
  out.chats = Object.assign({}, srv.chats || {});
  Object.keys(local.chats || {}).forEach(rk => { const m = {}; (out.chats[rk] || []).forEach(x => { if (x && x.id) m[x.id] = x; }); (local.chats[rk] || []).forEach(x => { if (!x || !x.id) return; const ex = m[x.id]; if (!ex) { m[x.id] = x; return; } const reads = [...new Set([...(ex.reads || []), ...(x.reads || [])])]; m[x.id] = Object.assign({}, ex, x, { reads }); }); out.chats[rk] = Object.values(m).sort((a, b) => (a.at || 0) - (b.at || 0)); });
  // カルテ
  out.karte = Object.assign({}, srv.karte || {});
  Object.keys(local.karte || {}).forEach(k => { const L = out.karte[k] || []; const seen = new Set(L.map(x => x.at + '|' + x.by)); (local.karte[k] || []).forEach(x => { if (!seen.has(x.at + '|' + x.by)) L.push(x); }); L.sort((a, b) => (b.at || 0) - (a.at || 0)); out.karte[k] = L; });
  // 月別（payAdj/extHours/payConfirm/shiftOK 等）
  const HANDLED = new Set(['chats', 'tasks', 'reports', 'orders', 'clock', 'karte', 'ownerAlerts', 'events', 'delTasks', 'delOrders', 'delReports', 'delAlerts', 'delClock', 'mutedAlerts']);
  Object.keys(local).forEach(k => {
    if (HANDLED.has(k) || k.indexOf('_') === 0) return; const S = srv[k], L = local[k]; if (L == null) return; if (S == null) { out[k] = L; return; }
    if (Array.isArray(S) && Array.isArray(L)) { const hasId = S.concat(L).some(x => x && x.id); out[k] = hasId ? mergeById(L, S, 'id') : (L.length >= S.length ? L : S); return; }
    if (typeof S === 'object' && typeof L === 'object' && !Array.isArray(S) && !Array.isArray(L)) { const o = Object.assign({}, S); Object.keys(L).forEach(mk => { const a = L[mk], b = S[mk]; if (Array.isArray(a) && Array.isArray(b)) { const seen = new Set(); const merged = []; b.concat(a).forEach(x => { const sig = (x && x.id) || JSON.stringify([x && x.staff, x && x.label, x && x.amount, x && x.date, x && x.hours, x && x.at]); if (seen.has(sig)) return; seen.add(sig); merged.push(x); }); o[mk] = merged; } else if (a && typeof a === 'object' && b && typeof b === 'object' && !Array.isArray(a)) o[mk] = Object.assign({}, b, a); else if (a != null) o[mk] = a; }); out[k] = o; return; }
    out[k] = L;
  });
  return out;
}

// ---------- 権限：staff が送ってきた全体データから「許可された変更」だけを採用（fail-closed） ----------
function applyStaffDataChanges(srvMerged, clientData, staffId) {
  // srvMerged = サーバー現在（既に owner 相当で統合済みではない。ここではサーバー現在値をベースに許可項目のみ統合する）
  const base = srvMerged; const c = clientData || {}; const out = Object.assign({}, base);
  const allowed = {};
  ['bookings', 'delBookings', 'customers', 'deletedCust', 'checklist', 'boards', 'delBoards', 'referrals', 'announcements', 'delAnnouncements', 'feedback', 'docs'].forEach(k => { if (c[k] != null) allowed[k] = c[k]; });
  // 自分のシフト・ブロックだけ
  if (c.shiftOverrides && c.shiftOverrides[staffId]) allowed.shiftOverrides = { [staffId]: c.shiftOverrides[staffId] };
  if (c.shifts && c.shifts[staffId]) allowed.shifts = { [staffId]: c.shifts[staffId] };
  if (Array.isArray(c.blocks)) allowed.blocks = (base.blocks || []).filter(b => b.staffId !== staffId).concat(c.blocks.filter(b => b && b.staffId === staffId));
  // 顧客の削除は staff 不可（deletedCust の追加を無視）
  if (allowed.deletedCust) allowed.deletedCust = base.deletedCust || {};
  // 統合（許可分のみ）
  const merged = mergeData(allowed, base);
  // 明示的に不可のキーはサーバー値を強制
  ['staff', 'services', 'settings', 'coupons', 'delServices', 'delStaff', 'eshop', 'campaigns', 'shiftMonths'].forEach(k => { merged[k] = base[k]; });
  // 他人のシフトはサーバー値
  merged.shiftOverrides = Object.assign({}, base.shiftOverrides || {}, allowed.shiftOverrides ? { [staffId]: merged.shiftOverrides[staffId] } : {});
  merged.shifts = Object.assign({}, base.shifts || {}, allowed.shifts ? { [staffId]: merged.shifts[staffId] } : {});
  return merged;
}
function applyStaffWorkChanges(base, clientWork, staffId) {
  const c = clientWork || {}; const allowed = {};
  ['tasks', 'delTasks', 'chats', 'reports', 'delReports', 'orders', 'delOrders', 'karte', 'ownerAlerts', 'delAlerts', 'mutedAlerts', 'events', 'shopItems'].forEach(k => { if (c[k] != null) allowed[k] = c[k]; });
  // 打刻：自分の分だけ
  if (Array.isArray(c.clock)) allowed.clock = (base.clock || []).filter(x => x.staff !== staffId).concat(c.clock.filter(x => x && x.staff === staffId));
  if (Array.isArray(c.delClock)) allowed.delClock = c.delClock;
  // 給与：経費申告（payAdj）は自分の分だけ追加可。extHours/payConfirm/自分以外は不可
  if (c.payAdj) { const o = {}; Object.keys(c.payAdj).forEach(mk => { o[mk] = ((base.payAdj || {})[mk] || []).filter(x => x.staff !== staffId).concat((c.payAdj[mk] || []).filter(x => x && x.staff === staffId)); }); allowed.payAdj = o; }
  const merged = mergeWork(allowed, base);
  ['extHours', 'payConfirm', 'shiftOK', 'gcalLog'].forEach(k => { merged[k] = base[k]; });
  return merged;
}

// ---------- 予約重なり（サーバー側・分単位） ----------
function bkStartMin(b) { const p = String(b.time || '0:0').split(':'); return (+p[0]) * 60 + (+p[1] || 0); }
function bkDurMin(b) { return (b.items || []).reduce((a, i) => a + (i.min || 0), 0) || 60; }
function overlaps(aS, aE, bS, bE) { return aS < bE && aE > bS; }
function findOverlap(bookings, staffId, dateStr, startMin, durMin, excludeId) {
  const end = startMin + (durMin || 60);
  return (bookings || []).find(b => b && b.id !== excludeId && b.staffId === staffId && b.date === dateStr && b.status !== 'cancelled' && overlaps(startMin, end, bkStartMin(b), bkStartMin(b) + bkDurMin(b))) || null;
}

// ---------- 公開用（allowlist） ----------
function publicDataAllowlist(d) {
  d = d || {};
  const staff = (d.staff || []).filter(s => s && s.id !== 's0' && !s.hidden && !s.inactive).map(s => ({ id: s.id, name: s.name, role: s.role || '', intro: s.intro || '', quals: s.quals || '', photo: s.photo || '', thumb: s.thumb || '', color: s.color || '', services: s.services || [], prices: s.prices || {} }));
  const services = (d.services || []).map(x => ({ id: x.id, cat: x.cat, name: x.name, i18n: x.i18n, min: x.min, price: x.price, desc: x.desc, detail: x.detail, img: x.img, thumb: x.thumb, photos: x.photos, addons: x.addons, tfree: x.tfree, addon: x.addon, minRank: x.minRank || 0, mens: false, pair: false }));
  const S = d.settings || {};
  const settings = { texts: S.texts || {}, theme: S.theme || {}, banners: S.banners || [], openException: S.openException || {}, address: S.address || '', mapUrl: S.mapUrl || '', lineUrl: S.lineUrl || '', catalogUrl: S.catalogUrl || '', reviewUrl: S.reviewUrl || '', shopUrl: S.shopUrl || '', instagram: S.instagram || '', birthdayMsg: '' };
  return { staff, services, settings, docs: d.docs || [], announcements: [], campaigns: [], coupons: [], boards: (d.boards || []).map(b => ({ id: b.id, owner: '', name: b.name || '', text: b.text || '', at: b.at, img: b.img || '' })) };
}

module.exports = { SUPA_URL, ALLOWED_ORIGIN, COOKIE_NAME, jstNow, jstDateStr, jstMinutesOfDay, jstEpochOf, jstDow, isDateStr, addDays, kvGet, kvGetRow, kvCasPut, kvSaveWithRetry, ensurePreRlsBackup, checkStaffPassword, signToken, verifyToken, parseCookies, setSessionCookie, clearSessionCookie, authenticate, requireOrigin, noStore, rateLimit, mergeData, mergeWork, findOverlap, bkStartMin, bkDurMin, publicDataAllowlist };
