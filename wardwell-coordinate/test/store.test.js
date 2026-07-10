import test from 'node:test';
import assert from 'node:assert/strict';
import { openDb } from '../src/db.js';
import { saveWard, getWard, listWards, createEffects, listNotifications, listTasks } from '../src/store.js';
import { mkWard, advanceWard, markDeceased } from '../src/rules.js';

function openTestDb() { return openDb(':memory:'); }

test('saveWard + getWard round-trip a ward including JSON fields', () => {
  const db = openTestDb();
  const w = mkWard({ id: 'W1', name: 'Test Ward', facility: 'Test Facility', stage: 1 });
  saveWard(db, w);
  const back = getWard(db, 'W1');
  assert.equal(back.name, 'Test Ward');
  assert.deepEqual(back.docs, w.docs);
  assert.deepEqual(back.timeline, []);
  assert.equal(back.courtWatch, null);
});

test('createEffects persists notification rows tied to the ward when a rule fires', () => {
  const db = openTestDb();
  // stage 3, withholdCurrent so the medical docs start unchecked (matches
  // how a freshly-arrived case actually looks — see rules.test.js).
  const w = mkWard({ id: 'W2', name: 'Persist Ward', facility: 'F', stage: 3, representative: 'professional', withholdCurrent: true });
  saveWard(db, w);
  const effects = createEffects(db, w);

  const blocked = advanceWard(w, effects);
  assert.equal(blocked.ok, false);

  w.docs.docltr = true; w.docs.questionnaire = true;
  const advanced = advanceWard(w, effects); // stage 3 -> 4, fires R8 notification
  assert.equal(advanced.ok, true);
  saveWard(db, w);

  const notifs = listNotifications(db);
  assert.ok(notifs.length > 0);
  assert.ok(notifs.every((n) => n.ward_id === 'W2'));
});

test('listWards returns saved wards ordered by creation', () => {
  const db = openTestDb();
  saveWard(db, mkWard({ id: 'A', name: 'Alpha', facility: 'F', stage: 1 }));
  saveWard(db, mkWard({ id: 'B', name: 'Beta', facility: 'F', stage: 1 }));
  const all = listWards(db);
  assert.equal(all.length, 2);
  assert.deepEqual(all.map((w) => w.id), ['A', 'B']);
});

test('markDeceased through createEffects cancels open tasks in the DB', () => {
  const db = openTestDb();
  const w = mkWard({ id: 'W3', name: 'Ward', facility: 'F', stage: 1 });
  saveWard(db, w);
  const effects = createEffects(db, w);
  effects.addTask(w, 'Do a thing', 'Someone');
  markDeceased(w, '2026-07-01', effects);
  saveWard(db, w);
  const tasks = listTasks(db);
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].cancelled, 1);
});
