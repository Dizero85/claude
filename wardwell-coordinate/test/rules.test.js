import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mkWard, stageById, advanceWard, sendBackWard, markDeceased, dismissWard,
  reinstateWard, confirmHearing, isClosed, applyStageEntryRules,
  recordHearingFound, recordCourtCheckNoChange,
} from '../src/rules.js';

// Minimal in-memory effects harness — records everything rules.js does
// instead of persisting to a database, so these tests run with no I/O.
function makeEffects() {
  const state = { logs: [], notifs: [], tasks: [], syncs: [], firedRules: new Set(), refSeq: 1 };
  const effects = {
    log: (ward, text, kind) => state.logs.push({ ward: ward.id, text, kind }),
    notify: (ward, text, kind) => { state.notifs.push({ ward: ward.id, text, kind: kind || 'rule' }); return `N${state.notifs.length}`; },
    addTask: (ward, text, owner) => { state.tasks.push({ ward: ward.id, text, owner }); return `T${state.tasks.length}`; },
    addTaskBoardSync: (ward, text) => { state.syncs.push({ ward: ward.id, text }); return `S${state.syncs.length}`; },
    markRuleFired: (id) => state.firedRules.add(id),
    genCaseRef: () => `PB-2026-0${4400 + state.refSeq++}`,
    hearingDateProvider: () => 'Jul 22, 2026',
    cancelOpenTasksFor: (wardId) => {
      const before = state.tasks.length;
      state.tasks = state.tasks.filter((t) => t.ward !== wardId);
      return before - state.tasks.length;
    },
  };
  return { state, effects };
}

function freshWard(over) {
  return mkWard(Object.assign({
    id: 'TX', name: 'Test Ward', facility: 'Test Facility',
    capacity: 'need', funding: 'family', stage: 1, daysInStage: 0,
    category: 'standard', representative: 'professional',
  }, over || {}));
}
function fillDoc(ward, stageId) {
  for (const d of stageById(stageId).docs) if (d.req) ward.docs[d.k] = true;
}

test('a corporate-funded ward moves through every stage — no skip', () => {
  const { effects } = makeEffects();
  const w = freshWard({ funding: 'corporate', stage: 2 });
  fillDoc(w, 2);
  const res = advanceWard(w, effects);
  assert.equal(res.ok, true);
  assert.equal(w.stage, 3);
  assert.equal(stageById(3).name, 'Medical documents');
});

test('reaching stage 7 fires exactly one Approver notification (R1)', () => {
  const { state, effects } = makeEffects();
  const w = freshWard({ stage: 6, representative: 'family', repName: 'daughter' });
  fillDoc(w, 6);
  w.courtWatch = { status: 'sched', date: 'Jul 1, 2026', lastChecked: null };
  const res = advanceWard(w, effects);
  assert.equal(res.ok, true);
  assert.equal(w.stage, 7);
  const approverNotifs = state.notifs.filter((n) => n.text.includes('Approver notified'));
  assert.equal(approverNotifs.length, 1);
  assert.ok(state.firedRules.has('R1'));
});

test('R7 blocks reaching stage 7 while representative is pending', () => {
  const { effects } = makeEffects();
  const w = freshWard({ stage: 6, representative: 'pending' });
  fillDoc(w, 6);
  const res = advanceWard(w, effects);
  assert.equal(res.ok, false);
  assert.match(res.reason, /Pending/);
  assert.equal(w.stage, 6);
});

test('R5 blocks advancing from stage 5 without the LVR', () => {
  const { effects } = makeEffects();
  const w = freshWard({ stage: 5, lvr: false });
  fillDoc(w, 5);
  const res = advanceWard(w, effects);
  assert.equal(res.ok, false);
  assert.match(res.reason, /Legal Verified Receipt/);
});

test('R5 blocks advancing with missing required docs and names them', () => {
  const { effects } = makeEffects();
  // withholdCurrent:true leaves stage 3's own docs unchecked (docs for
  // earlier stages still default to done) — mirrors WARD_SEED entries like
  // W2/W3 in the original demo.
  const w = freshWard({ stage: 3, withholdCurrent: true });
  const res = advanceWard(w, effects);
  assert.equal(res.ok, false);
  assert.match(res.reason, /Doctor's letter/);
  assert.match(res.reason, /questionnaire/i);
});

test('R9 payer routing note is logged on entering stage 4', () => {
  const { effects } = makeEffects();
  const w = freshWard({ stage: 3, funding: 'corporate' });
  fillDoc(w, 3);
  const res = advanceWard(w, effects);
  assert.equal(res.ok, true);
  assert.equal(w.stage, 4);
  assert.ok(w.timeline.some((t) => t.includes('referral')));
});

test('R3 activates court watch on entering stage 5', () => {
  const { state, effects } = makeEffects();
  const w = freshWard({ stage: 4, funding: 'corporate' });
  fillDoc(w, 4);
  const res = advanceWard(w, effects);
  assert.equal(res.ok, true);
  assert.equal(w.stage, 5);
  assert.ok(w.caseRef);
  assert.equal(w.courtWatch.status, 'await');
  assert.ok(state.firedRules.has('R3'));
});

test('R2 opens the medical-documents task when a request is logged (stage 1)', () => {
  const { state, effects } = makeEffects();
  const w = freshWard({ stage: 1 });
  // Stage 1 is the initial stage, so R2 fires on creation-time seeding
  // rather than via advanceWard (there's no stage 0 to advance from) —
  // this is what seedWorld()/import do for a newly created stage-1 case.
  applyStageEntryRules(w, effects);
  assert.ok(state.firedRules.has('R2'));
  assert.equal(state.tasks.length, 1);
});

test('R4 fires onboarding notifications, a task, and a task-board sync at stage 7', () => {
  const { state, effects } = makeEffects();
  const w = freshWard({ stage: 6, representative: 'professional' });
  fillDoc(w, 6);
  w.courtWatch = { status: 'sched', date: 'Jul 1, 2026', lastChecked: null };
  advanceWard(w, effects);
  assert.equal(w.stage, 7);
  assert.ok(state.firedRules.has('R4'));
  assert.equal(state.syncs.length, 1);
  assert.ok(w.syncedToTaskBoard);
  assert.ok(state.tasks.some((t) => t.text.includes('rep-payee account')));
});

test('markDeceased (R6) stops open tasks and court watch, preserves logs, fires one billing notification', () => {
  const { state, effects } = makeEffects();
  const w = freshWard({ stage: 5 });
  w.courtWatch = { status: 'await', date: null, lastChecked: null };
  effects.addTask(w, 'Some open task', 'Onboarding');
  const res = markDeceased(w, '2026-07-01', effects);
  assert.equal(res.ok, true);
  assert.equal(res.cancelledTasks, 1);
  assert.equal(w.courtWatch.status, 'closed');
  assert.ok(isClosed(w));
  const billingNotifs = state.notifs.filter((n) => n.kind === 'billing');
  assert.equal(billingNotifs.length, 1);
  assert.ok(state.firedRules.has('R6'));
});

test('dismissed cases cannot advance and reinstate returns them to the board', () => {
  const { effects } = makeEffects();
  const w = freshWard({ stage: 2 });
  dismissWard(w, 'ward regained capacity', effects);
  assert.ok(isClosed(w));
  const res = advanceWard(w, effects);
  assert.equal(res.ok, false);
  reinstateWard(w, 'standard', effects);
  assert.equal(w.category, 'standard');
  assert.equal(w.dismissedReason, '');
});

test('confirmHearing (R10) marks the hearing confirmed and logs a dated note', () => {
  const { state, effects } = makeEffects();
  const w = freshWard({ stage: 6 });
  w.courtWatch = { status: 'sched', date: 'Jul 22, 2026', lastChecked: null };
  confirmHearing(w, effects);
  assert.equal(w.hearingConfirmed, true);
  assert.ok(state.firedRules.has('R10'));
  assert.ok(state.logs.some((l) => l.text.includes('Jul 22, 2026')));
});

test('entering stage 6 does NOT fabricate a hearing date — stays awaiting the scheduler', () => {
  const { effects } = makeEffects();
  const w = freshWard({ stage: 5, lvr: true });
  w.courtWatch = { status: 'await', date: null, lastChecked: null };
  fillDoc(w, 5);
  const res = advanceWard(w, effects);
  assert.equal(res.ok, true);
  assert.equal(w.stage, 6);
  assert.equal(w.courtWatch.date, null);
  assert.equal(w.courtWatch.status, 'await');
});

test('recordHearingFound sets the date, fires one notification, and is idempotent on repeat finds of the same date', () => {
  const { state, effects } = makeEffects();
  const w = freshWard({ stage: 6 });
  w.courtWatch = { status: 'await', date: null, lastChecked: null };
  const first = recordHearingFound(w, 'Jul 22, 2026', effects);
  assert.equal(first.changed, true);
  assert.equal(w.courtWatch.status, 'sched');
  assert.equal(w.hearingConfirmed, false);
  assert.equal(state.notifs.length, 1);

  const second = recordHearingFound(w, 'Jul 22, 2026', effects);
  assert.equal(second.changed, false);
  assert.equal(state.notifs.length, 1, 'no duplicate notification for an unchanged date');
});

test('recordHearingFound with a NEW date re-notifies (the reported date moved)', () => {
  const { state, effects } = makeEffects();
  const w = freshWard({ stage: 6 });
  w.courtWatch = { status: 'sched', date: 'Jul 22, 2026', lastChecked: null, };
  w.hearingConfirmed = true; // was confirmed against the old date
  const res = recordHearingFound(w, 'Aug 03, 2026', effects);
  assert.equal(res.changed, true);
  assert.equal(w.hearingConfirmed, false, 'a changed date must return to unverified');
  assert.equal(state.notifs.length, 1);
});

test('recordCourtCheckNoChange only bumps lastChecked, no notification', () => {
  const { state, effects } = makeEffects();
  const w = freshWard({ stage: 6 });
  w.courtWatch = { status: 'await', date: null, lastChecked: null };
  recordCourtCheckNoChange(w, effects);
  assert.ok(w.courtWatch.lastChecked);
  assert.equal(state.notifs.length, 0);
});

test('sendBackWard moves a case back one stage and cannot go below stage 1', () => {
  const { effects } = makeEffects();
  const w = freshWard({ stage: 3 });
  const res = sendBackWard(w, effects);
  assert.equal(res.ok, true);
  assert.equal(w.stage, 2);
  w.stage = 1;
  const blocked = sendBackWard(w, effects);
  assert.equal(blocked.ok, false);
});
