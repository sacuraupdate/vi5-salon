// スタッフ用サーバーAPI（Cookie認証・権限・CAS保存）
'use strict';
const L = require('./_lib');

function stripSecrets(d) { if (!d) return d; const o = Object.assign({}, d); delete o.auth; delete o._auth; return o; }
function staffViewData(d, staffId) { // staff には他人の時給を渡さない
  const o = stripSecrets(d); o.staff = (o.staff || []).map(s => s.id === staffId ? s : Object.assign({}, s, { wage: undefined, hourly: undefined }));
  return o;
}
function staffViewWork(w, staffId) {
  const o = Object.assign({}, w || {}); const own = x => x && x.staff === staffId;
  if (o.payAdj) { const p = {}; Object.keys(o.payAdj).forEach(mk => { p[mk] = (o.payAdj[mk] || []).filter(own); }); o.payAdj = p; }
  if (o.extHours) { const p = {}; Object.keys(o.extHours).forEach(mk => { p[mk] = (o.extHours[mk] || []).filter(own); }); o.extHours = p; }
  if (o.clock) o.clock = o.clock.filter(c => own(c) || (c.pending || c.pendingFix)); // 他人の打刻は承認待ちのみ（表示上必要）
  delete o.payConfirm; delete o.gcalLog;
  return o;
}
function readBody(req) { return new Promise((res) => { if (req.body && typeof req.body === 'object') return res(req.body); let s = ''; req.on('data', c => s += c); req.on('end', () => { try { res(JSON.parse(s || '{}')); } catch (e) { res({}); } }); }); }

module.exports = async (req, res) => {
  L.noStore(res);
  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'method' }); return; }
  if (!L.requireOrigin(req)) { res.status(403).json({ ok: false, error: 'origin' }); return; }
  const ct = String(req.headers['content-type'] || ''); if (ct.indexOf('application/json') < 0) { res.status(415).json({ ok: false, error: 'content-type' }); return; }
  const b = await readBody(req); const op = String(b.op || '');
  try {
    await L.ensurePreRlsBackup().catch(() => {}); // 固定復旧ポイント（存在すれば何もしない）

    // ---------- ログイン ----------
    if (op === 'login') {
      const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'ip';
      if (!(await L.rateLimit('login:' + ip, 30, 600))) { res.status(429).json({ ok: false, error: 'rate' }); return; }
      const sid = String(b.staffId || ''); const pw = String(b.password || '');
      if (!(await L.rateLimit('login:sid:' + sid, 8, 600))) { res.status(429).json({ ok: false, error: 'rate' }); return; }
      let auth = (await L.kvGet('salon:auth')) || {};
      // 初期化：salon:auth が空で、OWNER_TEMP_PASSWORD 一致時のみオーナー(s1)を作成
      if (!Object.keys(auth).length) {
        const tmp = process.env.OWNER_TEMP_PASSWORD || '';
        if (!tmp || sid !== 's1' || pw !== tmp) { res.status(401).json({ ok: false, error: 'auth' }); return; }
        const h = L.hashPassword(pw); auth = { s1: { role: 'owner', salt: h.salt, hash: h.hash, sessionVersion: 1, mustChange: true, createdAt: Date.now() } };
        await L.kvSaveWithRetry('salon:auth', () => auth);
      }
      const rec = auth[sid]; if (!rec || rec.disabled || !L.verifyPassword(pw, rec)) { res.status(401).json({ ok: false, error: 'auth' }); return; }
      const tok = L.signToken({ sid, sv: rec.sessionVersion || 0, exp: Date.now() + 30 * 86400000 });
      L.setSessionCookie(res, tok);
      res.status(200).json({ ok: true, staffId: sid, role: rec.role || 'staff', mustChange: !!rec.mustChange }); return;
    }
    if (op === 'logout') { L.clearSessionCookie(res); res.status(200).json({ ok: true }); return; }

    // ---------- 以降は認証必須 ----------
    const me = await L.authenticate(req);
    if (!me) { res.status(401).json({ ok: false, error: 'unauth' }); return; }
    const isOwner = me.role === 'owner';
    if (op === 'whoami') { res.status(200).json({ ok: true, staffId: me.staffId, role: me.role, mustChange: me.mustChange }); return; }

    // パスワード変更（本人）：sessionVersion+1 → 全端末失効 → 新Cookie発行
    if (op === 'changePassword') {
      const cur = String(b.current || ''), nw = String(b.next || '');
      if (nw.length < 10) { res.status(400).json({ ok: false, error: 'weak' }); return; }
      let ok = false, newSv = 0;
      await L.kvSaveWithRetry('salon:auth', (auth) => { const rec = (auth || {})[me.staffId]; if (!rec || !L.verifyPassword(cur, rec)) return null; const h = L.hashPassword(nw); rec.salt = h.salt; rec.hash = h.hash; rec.mustChange = false; rec.sessionVersion = (rec.sessionVersion || 0) + 1; rec.changedAt = Date.now(); newSv = rec.sessionVersion; ok = true; return auth; });
      if (!ok) { res.status(401).json({ ok: false, error: 'current' }); return; }
      L.setSessionCookie(res, L.signToken({ sid: me.staffId, sv: newSv, exp: Date.now() + 30 * 86400000 }));
      res.status(200).json({ ok: true }); return;
    }
    if (me.mustChange && op !== 'load' && op !== 'loadWork') { res.status(403).json({ ok: false, error: 'mustChange' }); return; }

    // ---------- オーナー専用 ----------
    if (op === 'resetPassword' || op === 'setRole' || op === 'revokeSessions' || op === 'disableStaff') {
      if (!isOwner) { res.status(403).json({ ok: false, error: 'forbidden' }); return; }
      const sid = String(b.staffId || ''); if (!sid) { res.status(400).json({ ok: false, error: 'staffId' }); return; }
      let temp = null;
      await L.kvSaveWithRetry('salon:auth', (auth) => { auth = auth || {}; const rec = auth[sid] || { role: 'staff', sessionVersion: 0 }; if (op === 'resetPassword') { temp = L.genTempPassword(); const h = L.hashPassword(temp); rec.salt = h.salt; rec.hash = h.hash; rec.mustChange = true; rec.disabled = false; } if (op === 'setRole') { rec.role = (b.role === 'owner') ? 'owner' : 'staff'; } if (op === 'disableStaff') { rec.disabled = !!b.disabled; } rec.sessionVersion = (rec.sessionVersion || 0) + 1; auth[sid] = rec; return auth; });
      res.status(200).json({ ok: true, tempPassword: temp }); return; // temp はこの1回だけ返す（保存しない）
    }
    if (op === 'listAuth') { if (!isOwner) { res.status(403).json({ ok: false }); return; } const auth = (await L.kvGet('salon:auth')) || {}; const out = {}; Object.keys(auth).forEach(k => { out[k] = { role: auth[k].role, mustChange: !!auth[k].mustChange, disabled: !!auth[k].disabled, sessionVersion: auth[k].sessionVersion || 0 }; }); res.status(200).json({ ok: true, auth: out }); return; }

    // ---------- データ ----------
    if (op === 'load') { const row = await L.kvGetRow('salon:data'); const d = row ? row.value : null; res.status(200).json({ ok: true, version: row ? row.version : 0, data: isOwner ? stripSecrets(d) : staffViewData(d, me.staffId) }); return; }
    if (op === 'loadWork') { const row = await L.kvGetRow('salon:work'); const w = row ? row.value : null; res.status(200).json({ ok: true, version: row ? row.version : 0, work: isOwner ? (w || {}) : staffViewWork(w || {}, me.staffId) }); return; }

    if (op === 'save') {
      const client = b.data; if (!client || typeof client !== 'object') { res.status(400).json({ ok: false, error: 'data' }); return; }
      delete client.auth; delete client._seed;
      // 予約の重なりはサーバーでも拒否（クライアント改変対策）
      const conflicts = [];
      const bks = (client.bookings || []).filter(x => x && x.status !== 'cancelled');
      for (const x of bks) { const c = L.findOverlap(bks, x.staffId, x.date, L.bkStartMin(x), L.bkDurMin(x), x.id); if (c && !x.pairId) conflicts.push({ a: x.id, b: c.id, staffId: x.staffId, date: x.date }); }
      if (conflicts.length) { res.status(409).json({ ok: false, error: 'overlap', conflicts: conflicts.slice(0, 5) }); return; }
      const r = await L.kvSaveWithRetry('salon:data', (cur) => { const base = cur || {}; const merged = isOwner ? L.mergeData(client, base) : L.applyStaffDataChanges(base, client, me.staffId); merged.updatedAt = Date.now(); merged.updatedBy = me.staffId; return merged; });
      // バックアップ（曜日・月）はサーバーで自動
      try { const d = await L.kvGet('salon:data'); const now = L.jstNow(); const w = now.getUTCDay(), m = now.getUTCMonth() + 1; const payload = { at: Date.now(), d }; await L.kvSaveWithRetry('salon:bak:' + w, () => payload, 2); await L.kvSaveWithRetry('salon:bak:m' + m, () => payload, 2); } catch (e) {}
      res.status(200).json({ ok: true, version: r.version, tries: r.tries }); return;
    }
    if (op === 'saveWork') {
      const client = b.work; if (!client || typeof client !== 'object') { res.status(400).json({ ok: false, error: 'work' }); return; }
      const r = await L.kvSaveWithRetry('salon:work', (cur) => { const base = cur || {}; const merged = isOwner ? L.mergeWork(client, base) : L.applyStaffWorkChanges(base, client, me.staffId); return merged; });
      res.status(200).json({ ok: true, version: r.version, tries: r.tries }); return;
    }
    if (op === 'saveEshop') { if (!isOwner) { res.status(403).json({ ok: false }); return; } await L.kvSaveWithRetry('salon:eshop', () => ({ products: (b.products || []), syncedAt: Date.now() })); res.status(200).json({ ok: true }); return; }

    // ---------- バックアップ（オーナー） ----------
    if (op === 'backups') {
      if (!isOwner) { res.status(403).json({ ok: false }); return; }
      const keys = ['salon:bak:pre-rls']; for (let w = 0; w < 7; w++) keys.push('salon:bak:' + w); for (let m = 1; m <= 12; m++) keys.push('salon:bak:m' + m);
      const out = [];
      for (const k of keys) { const v = await L.kvGet(k); if (!v) continue; const d = v.d || v.data || v; out.push({ key: k, at: v.at || 0, customers: Object.keys((d && d.customers) || {}).length, bookings: ((d && d.bookings) || []).length, staff: ((d && d.staff) || []).length, data: b.withData ? stripSecrets(d) : undefined }); }
      res.status(200).json({ ok: true, backups: out }); return;
    }

    // ---------- 監査：bonusPoints と pointLog 合計の一致確認（オーナー） ----------
    if (op === 'auditPoints') {
      if (!isOwner) { res.status(403).json({ ok: false }); return; }
      const d = (await L.kvGet('salon:data')) || {}; const rows = [];
      Object.keys(d.customers || {}).forEach(k => { const c = d.customers[k]; if (!c) return; const sum = (c.pointLog || []).reduce((a, e) => a + (Number(e && e.pts) || 0), 0); const bal = Number(c.bonusPoints || 0); rows.push({ key: k, name: c.name || '', bonusPoints: bal, logSum: sum, diff: bal - sum, logCount: (c.pointLog || []).length, noId: (c.pointLog || []).filter(e => !e || !e.id).length }); });
      const mismatch = rows.filter(r => r.diff !== 0);
      res.status(200).json({ ok: true, total: rows.length, matched: rows.length - mismatch.length, mismatched: mismatch.length, mismatches: mismatch.slice(0, 50) }); return;
    }

    res.status(400).json({ ok: false, error: 'op' });
  } catch (e) {
    res.status(e && e.status || 500).json({ ok: false, error: String(e && e.message || e), detail: e && e.detail });
  }
};
