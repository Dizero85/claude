// Ported from the demo's client-side CSV import (coordinate.html), unchanged
// in behavior — same header contract, same normalization/warning rules —
// just running server-side against real ward records instead of an
// in-browser array.
import { MIN_STAGE, MAX_STAGE, mkWard } from './rules.js';

export const CSV_HEADER = [
  'case_name', 'facility', 'stage', 'category', 'funding',
  'representative', 'filed_date', 'hearing_date', 'hearing_confirmed',
];

export function parseCSV(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = [];
  let row = [];
  let field = '';
  let i = 0;
  let inQ = false;
  const n = text.length;
  while (i < n) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQ = false; i++; continue;
      }
      field += ch; i++; continue;
    }
    if (ch === '"') { inQ = true; i++; continue; }
    if (ch === ',') { row.push(field); field = ''; i++; continue; }
    if (ch === '\r') { i++; continue; }
    if (ch === '\n') { row.push(field); field = ''; rows.push(row); row = []; i++; continue; }
    field += ch; i++;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ''));
}

function normStage(v) {
  const n = parseInt(String(v).trim(), 10);
  if (Number.isNaN(n)) return { val: 1, warn: `stage "${v}" not a number; row skipped`, skip: true };
  if (n < MIN_STAGE) return { val: MIN_STAGE, warn: `stage ${n} out of range (1-8); row skipped`, skip: true };
  if (n > MAX_STAGE) return { val: MAX_STAGE, warn: `stage ${n} out of range (1-8); clamped to 8, row skipped`, skip: true };
  return { val: n, warn: null, skip: false };
}
function mapCategory(v) {
  const k = String(v).trim().toLowerCase().replace(/\s*\(.*\)\s*/, '').replace(/\s+/g, '');
  const map = {
    standard: 'standard', escalated: 'escalated', escalatedpaid: 'escalated',
    tough: 'tough', toughcase: 'tough', protective: 'protective',
    protectiveservices: 'protective', dismissed: 'dismissed',
  };
  if (map[k]) return { val: map[k], warn: null };
  return { val: 'standard', warn: `category "${v}" unknown; defaulted to Standard` };
}
function normFunding(v) {
  const k = String(v).trim().toLowerCase();
  if (/corp/.test(k)) return { val: 'corporate', warn: null };
  if (/fam|priv/.test(k)) return { val: 'family', warn: null };
  return { val: 'family', warn: `funding "${v}" unknown; defaulted to Family (private pay)` };
}
function normRep(v) {
  const k = String(v).trim().toLowerCase();
  if (/prof/.test(k)) return { val: 'professional', rep: '', warn: null };
  if (/pend/.test(k) || k === '') return { val: 'pending', rep: '', warn: null };
  if (/fam/.test(k)) {
    const m = v.match(/\(([^)]*)\)/);
    return { val: 'family', rep: m ? m[1].trim() : '', warn: null };
  }
  return { val: 'pending', rep: '', warn: `representative "${v}" unknown; defaulted to Pending` };
}
function normBool(v) {
  const k = String(v).trim().toLowerCase();
  return ['1', 'true', 'yes', 'y', 'confirmed', 'on'].includes(k);
}

/**
 * @param {string} text raw CSV
 * @param {() => string} genId ward id generator (caller owns id space / persistence)
 * @param {() => string} genCaseRef case reference generator for stage 5/6 rows
 * @param {() => string} hearingDateProvider fallback hearing date when stage 6 and none given
 */
export function importCSV(text, { genId, genCaseRef, hearingDateProvider }) {
  const rows = parseCSV(text);
  if (!rows.length) return { ok: false, message: 'The file is empty.' };
  const header = rows[0].map((h) => h.trim().toLowerCase().replace(/^﻿/, ''));
  const headerMatches = CSV_HEADER.length === header.length && CSV_HEADER.every((h, idx) => header[idx] === h);
  if (!headerMatches) {
    return { ok: false, message: 'This importer expects the sample column layout: ' + CSV_HEADER.join(',') };
  }
  const idx = {};
  CSV_HEADER.forEach((h, i) => { idx[h] = i; });
  const wards = [];
  const warnings = [];
  let imported = 0;
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    const rowNo = r;
    const get = (h) => { const c = cells[idx[h]]; return c == null ? '' : c.trim(); };
    const name = get('case_name');
    if (!name) { warnings.push(`Row ${rowNo}: missing case_name; skipped.`); continue; }
    const facility = get('facility') || '(facility not given)';
    const st = normStage(get('stage'));
    if (st.skip) { warnings.push(`Row ${rowNo} (${name}): ${st.warn}`); continue; }
    const cat = mapCategory(get('category'));
    const fund = normFunding(get('funding'));
    const rep = normRep(get('representative'));
    const hearingConfirmed = normBool(get('hearing_confirmed'));
    const hearingDate = get('hearing_date');
    [cat.warn, fund.warn, rep.warn].filter(Boolean).forEach((msg) => warnings.push(`Row ${rowNo} (${name}): ${msg}`));

    const wd = mkWard({
      id: genId(), name, facility,
      capacity: 'need', funding: fund.val, stage: st.val,
      daysInStage: 0, category: cat.val,
      representative: rep.val, repName: rep.rep,
      hearingConfirmed,
    });
    if (wd.stage === 5 || wd.stage === 6) {
      if (!wd.caseRef) wd.caseRef = genCaseRef();
      wd.courtWatch = {
        status: wd.stage === 6 ? 'sched' : 'await',
        date: wd.stage === 6 ? (hearingDate || hearingDateProvider()) : null,
        lastChecked: new Date().toISOString(),
      };
    }
    if (wd.stage > 5) wd.lvr = true;
    if (wd.stage >= 4) {
      wd.timeline.push(fund.val === 'corporate'
        ? 'Corporate-funded: treated as a referral — the corporate payer coordinates the initial fee (owner differs from the law-firm-direct route).'
        : 'Family (private pay): the law firm coordinates the submission directly.');
    }
    if (wd.stage >= 7) wd.syncedToTaskBoard = true;
    wards.push({ ward: wd, rowNo });
    imported++;
  }
  return { ok: true, wards, warnings, imported, message: null };
}
