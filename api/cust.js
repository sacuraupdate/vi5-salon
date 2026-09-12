// お客様向けAPI（allowlist方式・サーバー側で空き確認と保存を同一処理・Asia/Tokyo固定）
'use strict';
const L = require('./_lib');
const crypto = require('crypto');
const norm = p => String(p || '').replace(/[^0-9]/g, '');
const CLOSED_DOW = 2; // 火曜定休
const OPEN_MIN = 9 * 60, LAST_RECEPTION_MIN = 21 * 60;
const CUTOFF_MIN = 180; // 受付は開始の3時間前まで
const CANCEL_DEADLINE_MIN = 21 * 60; // 前日21時まで

function readBody(req) { return new Promise((r) => { if (req.body && typeof req.body === 'object') return r(req.body); if (typeof req.body === 'string') { try { return r(JSON.parse(req.body)); } catch (e) {} } let s = ''; req.on('data', c => s += c); req.on('end', () => { try { r(JSON.parse(s || '{}')); } catch (e) { r({}); } }); }); }
function ip(req) { return String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'ip'; }

function salonClosed(d, ds) { const ex = ((d.settings || {}).openException || {})[ds]; if (ex === 'open') return false; if (ex === 'closed') return true; return L.jstDow(ds) === CLOSED_DOW; }
function effectiveShift(d, sid, ds) {
  const ov = ((d.shiftOverrides || {})[sid] || {})[ds];
  const dayOff = (d.blocks || []).some(b => b && b.staffId === sid && b.date === ds && !b.time);
  if (dayOff || salonClosed(d, ds)) return [];
  if (ov && ov.off) return [];
  let ranges = null;
  if (ov && Array.isArray(ov.ranges) && ov.ranges.length) ranges = ov.ranges;
  else { const wk = ((d.shifts || {})[sid] || {})[L.jstDow(ds)]; if (wk && wk.on !== false) { if (Array.isArray(wk.ranges) && wk.ranges.length) ranges = wk.ranges; else if (wk.start != null && wk.end != null && wk.on) ranges = [{ start: wk.start, end: wk.end }]; } }
  if (!ranges) return [];
  return ranges.map(r => ({ start: Math.round(Number(r.start) * 60), end: Math.round(Number(r.end) * 60) })).filter(r => r.end > r.start);
}
function busyIntervals(d, sid, ds) {
  const out = [];
  (d.bookings || []).forEach(b => { if (!b || b.staffId !== sid || b.date !== ds || b.status === 'cancelled') return; const s = L.bkStartMin(b); out.push({ s, e: s + L.bkDurMin(b) }); });
  (d.blocks || []).forEach(b => { if (!b || b.staffId !== sid || b.date !== ds || !b.time) return; const p = String(b.time).split(':'); const s = (+p[0]) * 60 + (+p[1] || 0); out.push({ s, e: s + 60 }); });
  return out.sort((a, b) => a.s - b.s);
}
function eligible(st, ids) { if (!st || st.id === 's0' || st.hidden || st.inactive) return false; const sv = st.services || []; if (sv.includes('none')) return false; if (!sv.length) return true; return ids.every(id => sv.includes(id)); }
function canModify(ds) { const deadline = L.jstEpochOf(L.addDays(ds, -1), CANCEL_DEADLINE_MIN); return Date.now() < deadline; }
function publicView(d) { const p = L.publicDataAllowlist(d); p.eshop = { products: ((d.eshop || {}).products || []) }; return p; }
function ownView(d, P) { const c = d.customers && d.customers[P]; if (!c) return null; const cc = Object.assign({}, c); delete cc.password; delete cc.salonNote; const bookings = (d.bookings || []).filter(b => norm(b.phone) === P); return { customer: cc, bookings }; }

module.exports = async (req, res) => {
  L.noStore(res);
  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'POST only' }); return; }
  try {
    const b = await readBody(req); const op = String(b.op || '');
    const d = await L.kvGet('salon:data'); if (!d) { res.status(503).json({ ok: false, error: 'data' }); return; }
    if (op === 'public') { res.status(200).json({ ok: true, data: publicView(d) }); return; }

    if (op === 'avail') {
      const from = String(b.from || ''), to = String(b.to || from);
      if (!L.isDateStr(from) || !L.isDateStr(to) || from > to) { res.status(400).json({ ok: false, error: 'date' }); return; }
      const span = Math.round((Date.parse(to) - Date.parse(from)) / 86400000); if (span > 45) { res.status(400).json({ ok: false, error: 'range' }); return; }
      const ids = Array.isArray(b.menuIds) ? b.menuIds.map(String) : [];
      const svcIds = new Set((d.services || []).map(x => x.id)); if (ids.some(id => !svcIds.has(id))) { res.status(400).json({ ok: false, error: 'menu' }); return; }
      const dur = ids.reduce((a, id) => { const s = (d.services || []).find(x => x.id === id); return a + (s && s.min || 0); }, 0) || 60;
      let staffList = (d.staff || []).filter(s => s && s.id !== 's0' && !s.hidden && !s.inactive);
      if (b.staffId) { const sid = String(b.staffId); if (!staffList.some(s => s.id === sid)) { res.status(400).json({ ok: false, error: 'staff' }); return; } staffList = staffList.filter(s => s.id === sid); }
      const days = {};
      for (let ds = from; ds <= to; ds = L.addDays(ds, 1)) { const closed = salonClosed(d, ds); const st = {}; if (!closed) staffList.forEach(s => { st[s.id] = { shift: effectiveShift(d, s.id, ds), busy: busyIntervals(d, s.id, ds), canDo: eligible(s, ids) }; }); days[ds] = { closed, staff: st }; }
      res.status(200).json({ ok: true, tz: 'Asia/Tokyo', now: Date.now(), today: L.jstDateStr(), cutoffMin: CUTOFF_MIN, openMin: OPEN_MIN, lastReceptionMin: LAST_RECEPTION_MIN, durMin: dur, days }); return;
    }

    if (op === 'login' || op === 'me') {
      if (!(await L.rateLimit('clogin:' + ip(req), 40, 600))) { res.status(429).json({ ok: false, error: 'rate' }); return; }
      const P = norm(b.phone); if (!(await L.rateLimit('clogin:p:' + P, 8, 600))) { res.status(429).json({ ok: false, error: 'rate' }); return; }
      const c = d.customers && d.customers[P]; if (!c) { res.status(404).json({ ok: false, error: 'nocust' }); return; }
      if (String(c.password == null ? '' : c.password) !== String(b.pw || '')) { res.status(401).json({ ok: false, error: 'badpw' }); return; }
      const pv = publicView(d); const own = ownView(d, P); pv.customers = {}; pv.customers[P] = own.customer; pv.bookings = own.bookings; res.status(200).json({ ok: true, data: pv }); return;
    }

    if (op === 'book') {
      if (!(await L.rateLimit('book:' + ip(req), 20, 600))) { res.status(429).json({ ok: false, error: 'rate' }); return; }
      const bk = b.booking || {}; const P = norm(bk.phone);
      if (!P || !L.isDateStr(bk.date) || !/^\d{2}:\d{2}$/.test(String(bk.time || '')) || !bk.staffId || !Array.isArray(bk.items) || !bk.items.length) { res.status(400).json({ ok: false, error: 'bad' }); return; }
      if (!(await L.rateLimit('book:p:' + P, 6, 600))) { res.status(429).json({ ok: false, error: 'rate' }); return; }
      const cust = d.customers && d.customers[P]; if (!cust || String(cust.password == null ? '' : cust.password) !== String(b.pw || '')) { res.status(401).json({ ok: false, error: 'auth' }); return; }
      const startMin = L.bkStartMin(bk); const dur = (bk.items || []).reduce((a, i) => a + (Number(i.min) || 0), 0) || 60;
      const startEpoch = L.jstEpochOf(bk.date, startMin); if (startEpoch - Date.now() < CUTOFF_MIN * 60000) { res.status(409).json({ ok: false, error: 'cutoff' }); return; }
      if (startMin < OPEN_MIN || startMin > LAST_RECEPTION_MIN) { res.status(409).json({ ok: false, error: 'hours' }); return; }
      let result = null;
      await L.kvSaveWithRetry('salon:data', (cur) => {
        const x = cur || {}; const st = (x.staff || []).find(s => s.id === bk.staffId); const ids = (bk.items || []).map(i => i.id).filter(Boolean);
        if (!st || !eligible(st, ids)) { result = { ok: false, error: 'staff' }; return null; }
        const sh = effectiveShift(x, bk.staffId, bk.date); const end = startMin + dur; if (!sh.some(r => startMin >= r.start && end <= r.end)) { result = { ok: false, error: 'shift' }; return null; }
        const busy = busyIntervals(x, bk.staffId, bk.date); if (busy.some(iv => startMin < iv.e && end > iv.s)) { result = { ok: false, error: 'taken' }; return null; }
        if ((x.bookings || []).some(o => o && o.status !== 'cancelled' && norm(o.phone) === P && o.date === bk.date && o.time === bk.time)) { result = { ok: false, error: 'dup' }; return null; }
        const id = 'B-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
        const rec = { id, createdAt: Date.now(), updatedAt: Date.now(), history: [{ at: Date.now(), type: '作成', detail: bk.date + ' ' + bk.time + ' ' + (st.name || ''), by: 'お客様' }], phone: P, name: cust.name, items: bk.items.map(i => ({ id: i.id, cat: i.cat, name: String(i.name || '').slice(0, 80), min: Number(i.min) || 0, price: Number(i.price) || 0 })), staffId: bk.staffId, date: bk.date, time: bk.time, companions: Array.isArray(bk.companions) ? bk.companions.slice(0, 5) : [], haste: bk.haste || '', pointsUsed: Number(bk.pointsUsed) || 0, couponUsed: 0, discountRate: Number(bk.discountRate) || 0, customerMemo: String(bk.customerMemo || '').slice(0, 500), status: 'confirmed', autoAssigned: !!bk.autoAssigned };
        x.bookings = x.bookings || []; x.bookings.push(rec);
        if (rec.pointsUsed > 0) { const c2 = x.customers[P]; if (c2) { c2.bonusPoints = (c2.bonusPoints || 0) - rec.pointsUsed; c2.pointLog = c2.pointLog || []; c2.pointLog.unshift({ id: crypto.randomUUID(), at: Date.now(), date: L.jstDateStr(), pts: -rec.pointsUsed, reason: 'ご予約でポイント利用' }); c2._u = Date.now(); } }
        result = { ok: true, booking: rec }; return x;
      });
      if (!result || !result.ok) { res.status(409).json(result || { ok: false, error: 'unknown' }); return; }
      res.status(200).json(result); return;
    }

    if (op === 'cancelOwn') {
      const P = norm(b.phone); const cust = d.customers && d.customers[P]; if (!cust || String(cust.password == null ? '' : cust.password) !== String(b.pw || '')) { res.status(401).json({ ok: false, error: 'auth' }); return; }
      let result = null;
      await L.kvSaveWithRetry('salon:data', (cur) => { const x = cur || {}; const bk = (x.bookings || []).find(o => o && o.id === b.bookingId && norm(o.phone) === P); if (!bk) { result = { ok: false, error: 'notfound' }; return null; } if (bk.status === 'cancelled') { result = { ok: true }; return null; } if (!canModify(bk.date)) { result = { ok: false, error: 'deadline' }; return null; } bk.status = 'cancelled'; bk.cancelledAt = Date.now(); bk.cancelledBy = b.reason === 'reschedule' ? 'お客様（時間変更）' : 'お客様（マイページ）'; bk.updatedAt = Date.now(); bk.history = bk.history || []; bk.history.push({ at: Date.now(), type: 'キャンセル', detail: '', by: bk.cancelledBy }); result = { ok: true }; return x; });
      if (!result.ok) { res.status(result.error === 'deadline' ? 409 : 404).json(result); return; } res.status(200).json(result); return;
    }

    if (op === 'register') {
      if (!(await L.rateLimit('reg:' + ip(req), 10, 600))) { res.status(429).json({ ok: false, error: 'rate' }); return; }
      const cust = b.customer || {}; const P = norm(cust.phone); if (!P || !cust.name) { res.status(400).json({ ok: false, error: 'bad' }); return; }
      if (d.customers && d.customers[P]) { res.status(409).json({ ok: false, error: 'exists' }); return; }
      cust.name = String(cust.name).slice(0, 60); cust.phone = P; cust.joined = cust.joined || L.jstDateStr(); cust.notices = cust.notices || []; if (cust.password != null) cust.password = String(cust.password).slice(0, 40); cust._u = Date.now();
      if (Array.isArray(cust.pointLog)) cust.pointLog = cust.pointLog.map(e => Object.assign({}, e, { id: e.id || crypto.randomUUID() }));
      const rp = norm(b.referrerPhone);
      await L.kvSaveWithRetry('salon:data', (x) => { x.customers = x.customers || {}; if (x.customers[P]) return null; x.nextCustNo = x.nextCustNo || (Object.keys(x.customers).length + 1); cust.no = x.nextCustNo++; x.customers[P] = cust; if (rp && x.customers[rp] && rp !== P) { x.referrals = x.referrals || []; x.referrals.push({ id: 'rf' + Date.now(), newPhone: P, newName: cust.name, refPhone: rp, refName: x.customers[rp].name || '', at: Date.now(), status: 'pending' }); } return x; });
      res.status(200).json({ ok: true }); return;
    }
    if (op === 'referral') { const P = norm(b.phone), rp = norm(b.referrerPhone); if (!P || !rp || rp === P) { res.status(200).json({ ok: false }); return; } await L.kvSaveWithRetry('salon:data', (x) => { if (!x.customers || !x.customers[P] || !x.customers[rp]) return null; x.referrals = x.referrals || []; if (x.referrals.some(r => r.newPhone === P)) return null; x.referrals.push({ id: 'rf' + Date.now(), newPhone: P, newName: x.customers[P].name || '', refPhone: rp, refName: x.customers[rp].name || '', at: Date.now(), status: 'pending' }); return x; }); res.status(200).json({ ok: true }); return; }
    if (op === 'readNotices') { const P = norm(b.phone); const c = d.customers && d.customers[P]; if (!c || String(c.password == null ? '' : c.password) !== String(b.pw || '')) { res.status(401).json({ ok: false }); return; } await L.kvSaveWithRetry('salon:data', (x) => { const cc = x.customers && x.customers[P]; if (!cc) return null; (cc.notices || []).forEach(n => { n.read = true; }); cc._u = Date.now(); return x; }); res.status(200).json({ ok: true }); return; }
    if (op === 'changePw') { const P = norm(b.phone); const c = d.customers && d.customers[P]; if (!c || String(c.password == null ? '' : c.password) !== String(b.pw || '')) { res.status(401).json({ ok: false }); return; } const nw = String(b.next || ''); if (nw.length < 4 || nw.length > 40) { res.status(400).json({ ok: false }); return; } await L.kvSaveWithRetry('salon:data', (x) => { const cc = x.customers && x.customers[P]; if (!cc) return null; cc.password = nw; cc._u = Date.now(); return x; }); res.status(200).json({ ok: true }); return; }
    if (op === 'board') {
      const P = norm(b.phone); const post = b.post || {}; if (post.text) post.text = String(post.text).slice(0, 2000); if (post.name) post.name = String(post.name).slice(0, 60);
      let result = { ok: true };
      await L.kvSaveWithRetry('salon:data', (x) => { x.boards = x.boards || []; if (b.action === 'add') { post.owner = P; post.at = post.at || Date.now(); if (!post.id) post.id = 'bd' + Date.now(); x.boards.unshift(post); return x; } const ix = x.boards.findIndex(q => q.id === (b.id || post.id)); if (ix < 0) { result = { ok: false, status: 404 }; return null; } if (norm(x.boards[ix].owner) !== P) { result = { ok: false, status: 403 }; return null; } if (b.action === 'del') { x.delBoards = x.delBoards || []; const rid = x.boards[ix].id; if (!x.delBoards.includes(rid)) x.delBoards.push(rid); x.boards.splice(ix, 1); } else x.boards[ix] = Object.assign({}, x.boards[ix], post, { owner: x.boards[ix].owner }); return x; });
      res.status(result.ok ? 200 : result.status).json({ ok: result.ok }); return;
    }
    if (op === 'order') { const o = b.order || {}; if (!o.name || !o.phone || !Array.isArray(o.items) || !o.items.length) { res.status(400).json({ ok: false }); return; } o.id = o.id || ('O' + Date.now()); o.at = Date.now(); o.status = 'new'; await L.kvSaveWithRetry('salon:work', (w) => { w = w || {}; w.orders = w.orders || []; w.orders.unshift(o); return w; }); res.status(200).json({ ok: true, id: o.id }); return; }
    res.status(400).json({ ok: false, error: 'unknown op' });
  } catch (e) { res.status(e && e.status || 500).json({ ok: false, error: String(e && e.message) }); }
};
