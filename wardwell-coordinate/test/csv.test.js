import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { importCSV } from '../src/csv.js';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SAMPLE = readFileSync(path.join(ROOT, 'samples', 'sample_cases.csv'), 'utf8');

function harness() {
  let seq = 0;
  return {
    genId: () => `I${++seq}`,
    genCaseRef: () => `PB-2026-0${4400 + seq}`,
    hearingDateProvider: () => 'Jul 22, 2026',
  };
}

test('imports the shipped sample_cases.csv: 11 of 12 rows (one bad stage skipped)', () => {
  const res = importCSV(SAMPLE, harness());
  assert.equal(res.ok, true);
  assert.equal(res.imported, 11);
  assert.equal(res.wards.length, 11);
  assert.equal(res.warnings.length, 1);
  assert.match(res.warnings[0], /stage 99 out of range/);
});

test('rejects a CSV with the wrong header', () => {
  const res = importCSV('a,b,c\n1,2,3\n', harness());
  assert.equal(res.ok, false);
  assert.match(res.message, /expects the sample column layout/);
});

test('skips a row with no case_name and warns', () => {
  const csv = 'case_name,facility,stage,category,funding,representative,filed_date,hearing_date,hearing_confirmed\n'
    + ',Some Facility,1,Standard,Family (private pay),Pending,,,\n';
  const res = importCSV(csv, harness());
  assert.equal(res.ok, true);
  assert.equal(res.imported, 0);
  assert.match(res.warnings[0], /missing case_name/);
});

test('a stage-6 imported case carries its hearing date and starts unverified when hearing_confirmed=no', () => {
  const res = importCSV(SAMPLE, harness());
  const sera = res.wards.find((w) => w.ward.name === 'Seraphina Ellsworth').ward;
  assert.equal(sera.stage, 6);
  assert.equal(sera.courtWatch.date, 'Jul 18, 2026');
  assert.equal(sera.hearingConfirmed, false);
});

test('corporate-funded rows at stage >=4 get the referral timeline note', () => {
  const res = importCSV(SAMPLE, harness());
  const barnaby = res.wards.find((w) => w.ward.name === 'Barnaby Wickersham').ward;
  assert.ok(barnaby.timeline.some((t) => t.includes('referral')));
});
