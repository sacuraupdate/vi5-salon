// Vi5 シフトカレンダー配信 (ICS)  /api/shift-ical?s=s1|s2|s3|book
// Googleカレンダーが自動で購読・更新する方式。Apps Script不要。
const SUPA_URL = 'https://tehcaufdztgpbrknpshk.supabase.co';
const SUPA_KEY = 'sb_publishable_CnOCyO9QU69K47vbbLRkYg__cEv53CJ';

const NAMES = { s1: 'SAKURA', s2: 'TOMOMI', s3: 'HARUKA' };
const MARKS = { s1: '\u{1F7E1}', s2: '\u{1F338}', s3: '\u{1F7E2}' }; // 🟡🌸🟢
const CLOSED_DOW = 2;

async function loadData() {
  const r = await fetch(SUPA_URL + '/rest/v1/kv?key=eq.salon:data&select=value', {
    headers: { apikey: SUPA_KEY, Authorization: 'Bearer ' + SUPA_KEY }
  });
  if (!r.ok) throw new Error('rest-' + r.status);
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

function fmtDate(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function normalizeShift(sh) {
  if (!sh) return { on: false, ranges: [] };
  if (sh.ranges) return { on: sh.on !== false, ranges: sh.ranges };
  if (sh.start !== undefined) return { on: sh.on !== false, ranges: [{ start: sh.start, end: sh.end }] };
  return { on: sh.on !== false, ranges: [{ start: 9, end: 21 }] };
}
function effectiveShift(DATA, sid, ds, dow) {
  const ov = DATA.shiftOverrides && DATA.shiftOverrides[sid] && DATA.shiftOverrides[sid][ds];
  if (ov) {
    if (ov.off) return { on: false, ranges: [] };
    if (ov.ranges) return { on: true, ranges: ov.ranges };
    return { on: true, ranges: [{ start: ov.start, end: ov.end }] };
  }
  return normalizeShift(DATA.shifts && DATA.shifts[sid] && DATA.shifts[sid][dow]);
}
function salonClosed(DATA, ds, dow) {
  const ex = ((DATA.settings || {}).openException || {})[ds];
  if (ex === 'open') return false;
  if (ex === 'closed') return true;
  return dow === CLOSED_DOW;
}
function isDayOff(DATA, sid, ds) {
  return (DATA.blocks || []).some(b => b.staffId === sid && b.date === ds && !b.time);
}
function dt(ds, hourFloat) {
  const h = Math.floor(hourFloat), m = Math.round((hourFloat % 1) * 60);
  return ds.replace(/-/g, '') + 'T' + String(h).padStart(2, '0') + String(m).padStart(2, '0') + '00';
}
function esc(t) { return String(t || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); }

const VTZ = ['BEGIN:VTIMEZONE', 'TZID:Asia/Tokyo', 'BEGIN:STANDARD', 'DTSTART:19700101T000000',
  'TZOFFSETFROM:+0900', 'TZOFFSETTO:+0900', 'TZNAME:JST', 'END:STANDARD', 'END:VTIMEZONE'];

module.exports = async (req, res) => {
  try {
    const s = (req.query && req.query.s) || 's1';
    const DATA = await loadData();
    if (!DATA) { res.status(503).send('data unavailable'); return; }
    const now = new Date();
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Vi5//shift//JP', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
    const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z/, 'Z');

    if (s === 'book') {
      lines.push('X-WR-CALNAME:Vi5 ご予約', 'X-WR-TIMEZONE:Asia/Tokyo', ...VTZ);
      const lim = new Date(now.getTime() - 30 * 86400000);
      (DATA.bookings || []).filter(b => b.status !== 'cancelled' && b.date && b.time && b.date >= fmtDate(lim)).forEach(b => {
        const dur = (b.items || []).reduce((a, i) => a + (i.min || 0), 0) || 60;
        const [hh, mm] = b.time.split(':').map(Number);
        const st = hh + (mm || 0) / 60;
        const menu = (b.items || []).map(i => i.name).join('\uFF0B');
        lines.push('BEGIN:VEVENT', 'UID:book-' + b.id + '@vi5', 'DTSTAMP:' + stamp,
          'DTSTART;TZID=Asia/Tokyo:' + dt(b.date, st), 'DTEND;TZID=Asia/Tokyo:' + dt(b.date, st + dur / 60),
          'SUMMARY:' + esc('\u{1F4C5}' + (b.name || 'お客様') + '様' + (menu ? '／' + menu : '')), 'END:VEVENT');
      });
    } else {
      const name = NAMES[s] || s;
      lines.push('X-WR-CALNAME:Vi5 ' + name + ' シフト', 'X-WR-TIMEZONE:Asia/Tokyo', ...VTZ);
      const start = new Date(now.getTime() - 30 * 86400000);
      for (let i = 0; i < 155; i++) {
        const d = new Date(start.getTime() + i * 86400000);
        const ds = fmtDate(d), dow = d.getDay();
        if (salonClosed(DATA, ds, dow) || isDayOff(DATA, s, ds)) continue;
        const sh = effectiveShift(DATA, s, ds, dow);
        if (!sh.on || !sh.ranges || !sh.ranges.length) continue;
        const st = Math.min.apply(null, sh.ranges.map(r => r.start));
        const en = Math.max.apply(null, sh.ranges.map(r => r.end));
        lines.push('BEGIN:VEVENT', 'UID:shift-' + s + '-' + ds + '@vi5', 'DTSTAMP:' + stamp,
          'DTSTART;TZID=Asia/Tokyo:' + dt(ds, st), 'DTEND;TZID=Asia/Tokyo:' + dt(ds, en),
          'SUMMARY:' + esc((MARKS[s] || '') + name + ' シフト'), 'END:VEVENT');
      }
    }
    lines.push('END:VCALENDAR');
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.status(200).send(lines.join('\r\n'));
  } catch (e) {
    res.status(500).send('error: ' + (e && e.message));
  }
};
