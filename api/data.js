// スタッフ用サーバーAPI（Cookie認証・権限・CAS保存）
'use strict';
const L = require('./_lib');

function stripSecrets(d) { if (!d) return d; const o = Object.assign({}, d); delete o.auth; delete o._auth; return o; }
function readBody(req) { return new Promise((res) => { if (req.body && typeof req.body === 'object') return res(req.body); let s = ''; req.on('data', c => s += c); req.on('end', () => { try { res(JSON.parse(s || '{}')); } catch (e) { res({}); } }); }); }

module.exports = async (req, res) => {
  L.noStore(res);
  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'method' }); return; }
  if (!L.requireOrigin(req)) { res.status(403).json({ ok: false, error: 'origin' }); return; }
  const ct = String(req.headers['content-type'] || ''); if (ct.indexOf('application/json') < 0) { res.status(415).json({ ok: false, error: 'content-type' }); return; }
  const b = await readBody(req); const op = String(b.op || '');
  try {
    await L.ensurePreRlsBackup().catch(() => {}); // 固定復旧ポイント（存在すれば何もしない）

    // ---------- ログイン（P0改修前と同じ「スタッフ専用の共通パスワード」1つだけ） ----------
    if (op === 'login') {
      const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'ip';
      if (!(await L.rateLimit('login:' + ip, 30, 600))) { res.status(429).json({ ok: false, error: 'rate' }); return; }
      const pw = String(b.password || '');
      if (!L.checkStaffPassword(pw)) { res.status(401).json({ ok: false, error: 'auth' }); return; }
      const tok = L.signToken({ role: 'staff', exp: Date.now() + 30 * 86400000 });
      L.setSessionCookie(res, tok);
      res.status(200).json({ ok: true }); return;
    }
    if (op === 'logout') { L.clearSessionCookie(res); res.status(200).json({ ok: true }); return; }

    // ---------- 以降は認証必須（ログインできていれば全機能利用可・従来どおり） ----------
    const me = await L.authenticate(req);
    if (!me) { res.status(401).json({ ok: false, error: 'unauth' }); return; }
    if (op === 'whoami') { res.status(200).json({ ok: true, role: me.role }); return; }

    // ---------- データ ----------
    if (op === 'load') { const row = await L.kvGetRow('salon:data'); const d = row ? row.value : null; res.status(200).json({ ok: true, version: row ? row.version : 0, data: stripSecrets(d) }); return; }
    if (op === 'loadWork') { const row = await L.kvGetRow('salon:work'); const w = row ? row.value : null; res.status(200).json({ ok: true, version: row ? row.version : 0, work: w || {} }); return; }

    if (op === 'save') {
      const client = b.data; if (!client || typeof client !== 'object') { res.status(400).json({ ok: false, error: 'data' }); return; }
      delete client.auth; delete client._seed;
      // 予約の重なりはサーバーでも拒否（クライアント改変対策）
      const conflicts = [];
      const bks = (client.bookings || []).filter(x => x && x.status !== 'cancelled');
      for (const x of bks) { const c = L.findOverlap(bks, x.staffId, x.date, L.bkStartMin(x), L.bkDurMin(x), x.id); if (c && !x.pairId) conflicts.push({ a: x.id, b: c.id, staffId: x.staffId, date: x.date }); }
      if (conflicts.length) { res.status(409).json({ ok: false, error: 'overlap', conflicts: conflicts.slice(0, 5) }); return; }
      const r = await L.kvSaveWithRetry('salon:data', (cur) => { const base = cur || {}; const merged = L.mergeData(client, base); merged.updatedAt = Date.now(); return merged; });
      // バックアップ（曜日・月）はサーバーで自動
      try { const d = await L.kvGet('salon:data'); const now = L.jstNow(); const w = now.getUTCDay(), m = now.getUTCMonth() + 1; const payload = { at: Date.now(), d }; await L.kvSaveWithRetry('salon:bak:' + w, () => payload, 2); await L.kvSaveWithRetry('salon:bak:m' + m, () => payload, 2); } catch (e) {}
      res.status(200).json({ ok: true, version: r.version, tries: r.tries }); return;
    }
    if (op === 'saveWork') {
      const client = b.work; if (!client || typeof client !== 'object') { res.status(400).json({ ok: false, error: 'work' }); return; }
      const r = await L.kvSaveWithRetry('salon:work', (cur) => L.mergeWork(client, cur || {}));
      res.status(200).json({ ok: true, version: r.version, tries: r.tries }); return;
    }
    if (op === 'saveEshop') { await L.kvSaveWithRetry('salon:eshop', () => ({ products: (b.products || []), syncedAt: Date.now() })); res.status(200).json({ ok: true }); return; }

    // ---------- バックアップ ----------
    if (op === 'backups') {
      const keys = ['salon:bak:pre-rls']; for (let w = 0; w < 7; w++) keys.push('salon:bak:' + w); for (let m = 1; m <= 12; m++) keys.push('salon:bak:m' + m);
      const out = [];
      for (const k of keys) { const v = await L.kvGet(k); if (!v) continue; const d = v.d || v.data || v; out.push({ key: k, at: v.at || 0, customers: Object.keys((d && d.customers) || {}).length, bookings: ((d && d.bookings) || []).length, staff: ((d && d.staff) || []).length, data: b.withData ? stripSecrets(d) : undefined }); }
      res.status(200).json({ ok: true, backups: out }); return;
    }

    // ---------- 監査：bonusPoints と pointLog 合計の一致確認 ----------
    if (op === 'auditPoints') {
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
