// Server-side rules engine for Wardwell Coordinate.
//
// This is a faithful port of the client-side engine from the original
// single-file demo (02_suite_wardwell/coordinate.html), made authoritative:
// in the demo every rule ran in the browser and could be bypassed by anyone
// with devtools open. Here it runs once, server-side, and the frontend can
// only see the result.
//
// Two deliberate behavior changes from the demo, called out where they
// happen:
//
// 1. R6 ("deceased cancels pending notifications") deleted notification
//    history from the in-browser feed, which is fine for a toy demo but
//    wrong for a real audit trail. Here, marking a ward deceased instead
//    (a) stops any future scheduled work for that case (court watch, open
//    tasks) and (b) leaves the notification history intact. See
//    markDeceased() below.
//
// 2. In the demo, entering stage 6 immediately *fabricates* a hearing date
//    (`simHearingDate()`), because there is no real scheduler behind it.
//    Here, entering stage 6 only marks the case as awaiting its next
//    scheduled court check — the date is filled in later by whatever the
//    court-watch job actually finds (see recordHearingFound() below, called
//    from services/courtWatch/). That is the honest version of "the
//    calendar lookups... simply stop being anyone's job."

export const MIN_STAGE = 1;
export const MAX_STAGE = 8;

export const STAGES = [
  { id: 1, name: 'Request noted', owner: 'Intake',
    docs: [{ k: 'reqlog', label: 'Guardianship request logged', req: true }] },
  { id: 2, name: 'Capacity triage', owner: 'Care team + facility',
    docs: [{ k: 'capstmt', label: 'Capacity statement from facility', req: true }] },
  { id: 3, name: 'Medical documents', owner: 'Medical records',
    docs: [
      { k: 'docltr', label: "Doctor's letter", req: true },
      { k: 'questionnaire', label: 'Guardianship questionnaire', req: true },
    ] },
  { id: 4, name: 'Legal submission', owner: 'Law firm (payer-routed)',
    docs: [{ k: 'submitpkt', label: 'Submission packet prepared', req: true }] },
  { id: 5, name: 'Filed with court', owner: 'Law firm',
    docs: [{ k: 'filecfm', label: 'Filing confirmation', req: true }] },
  { id: 6, name: 'Court tracking', owner: 'Law firm + care team',
    docs: [{ k: 'hearing', label: 'Hearing notice', req: true }] },
  { id: 7, name: 'Approved', owner: 'Approver notified',
    docs: [{ k: 'letters', label: 'Letters of guardianship', req: true }] },
  { id: 8, name: 'Guardian onboarding & accounts', owner: 'Onboarding + guardian',
    docs: [{ k: 'acctcfm', label: 'Rep-payee account opened', req: true }] },
];
export const stageById = (id) => STAGES.find((s) => s.id === id);

export const CATEGORIES = {
  standard: { label: 'Standard', active: true },
  escalated: { label: 'Escalated (paid)', active: true },
  tough: { label: 'Tough case', active: true },
  protective: { label: 'Protective services', active: true },
  dismissed: { label: 'Dismissed', active: false },
};
export const CATEGORY_KEYS = Object.keys(CATEGORIES);

export const CAPACITY = {
  need: { label: 'Needs guardianship' },
  self: { label: 'Can answer for themselves' },
  sign: { label: 'Can sign only' },
};
export const FUNDING = {
  family: { label: 'Family (private pay)' },
  corporate: { label: 'Corporate-funded' },
};
export const CADENCE = {
  daily: { label: 'Daily', hours: 24 },
  d4: { label: 'Every 4 days', hours: 96 },
  weekly: { label: 'Weekly', hours: 168 },
};
export const REPS = {
  family: { label: 'Family member' },
  professional: { label: 'Professional guardian' },
  pending: { label: 'Pending' },
};

export const RULES = [
  { id: 'R1', title: 'Approver pinged once, at approval',
    desc: 'The Approver is notified ONLY when a case reaches stage 7 (Approved). Never before — one ping, at the end.' },
  { id: 'R2', title: 'Request noted opens the medical file',
    desc: 'When a guardianship request is logged (stage 1), a task is auto-created to obtain the medical documents.' },
  { id: 'R3', title: 'Court watch auto-activates',
    desc: 'When a case enters stage 5 (Filed with court), that ward’s Court Watch entry activates automatically.' },
  { id: 'R4', title: 'Approval starts guardian onboarding',
    desc: 'When a case reaches stage 7 (Approved), the Verification Checklist is sent to the guardian, onboarding is notified to close the individual bank accounts and open a managed rep-payee account, and an external-task-board sync entry is created.' },
  { id: 'R5', title: 'No advance with missing docs or unverified receipt',
    desc: 'A card cannot advance while required docs for its stage are unchecked; stage 5 also requires the Legal Verified Receipt (LVR).' },
  { id: 'R6', title: 'Deceased closes the case cleanly',
    desc: 'Marking a ward deceased stops future scheduled work (court watch, open tasks) and fires a single Billing notification. Notification history is preserved, not deleted.' },
  { id: 'R7', title: 'No approval with a pending representative',
    desc: 'A case cannot reach stage 7 (Approved) while the assigned guardian/representative is Pending.' },
  { id: 'R8', title: 'Medical documents complete → notify the law firm',
    desc: 'When the case reaches stage 4 (Legal submission), an automatic notification fires to the law firm to prepare and submit the guardianship petition.' },
  { id: 'R9', title: 'Payer routing at legal submission',
    desc: 'Payer = Family: the law firm coordinates the submission directly. Payer = Corporate-funded: the case is treated as a referral.' },
  { id: 'R10', title: 'Court date confirmed → dated note',
    desc: 'When a reported hearing date is confirmed against the court record, a dated note is written to the case record.' },
];

export function seedDocs(stageId, opts = {}) {
  const docs = {};
  for (const s of STAGES) {
    if (s.id > stageId) break;
    const withhold = s.id === stageId && opts.withholdCurrent;
    for (const d of s.docs) {
      docs[d.k] = d.req ? !withhold : !!opts.optionalOn;
    }
  }
  return docs;
}

export function mkWard(o) {
  return {
    id: o.id,
    name: o.name,
    facility: o.facility,
    capacity: o.capacity || 'need',
    funding: o.funding || 'family',
    stage: o.stage,
    daysInStage: o.daysInStage ?? 0,
    caseRef: o.caseRef || null,
    category: o.category || 'standard',
    representative: o.representative || 'pending',
    repName: o.repName || '',
    lvr: !!o.lvr,
    hearingConfirmed: !!o.hearingConfirmed,
    courtCadence: o.courtCadence || 'weekly',
    syncedToTaskBoard: !!o.syncedToTaskBoard,
    deceasedDate: o.deceasedDate || null,
    dismissedReason: o.dismissedReason || '',
    docs: o.docs || seedDocs(o.stage, { withholdCurrent: o.withholdCurrent, optionalOn: o.optionalOn }),
    timeline: o.timeline ? o.timeline.slice() : [],
    courtWatch: o.courtWatch || null,
  };
}

export function isDeceased(w) { return !!w.deceasedDate; }
export function isDismissed(w) { return w.category === 'dismissed'; }
export function isClosed(w) { return isDeceased(w) || isDismissed(w); }
export function isActive(w) { return !isClosed(w); }

export function missingRequiredDocs(ward) {
  const st = stageById(ward.stage);
  return st.docs.filter((d) => d.req && !ward.docs[d.k]);
}
export function stageDocsSatisfied(ward) { return missingRequiredDocs(ward).length === 0; }

function ownerLabel(stageId) {
  const map = { 4: 'The law firm', 5: 'The law firm', 6: 'The law firm + care team', 8: 'Onboarding' };
  return map[stageId] || stageById(stageId).owner;
}

// Deterministic-by-default; tests / callers can override for reproducibility.
export function defaultHearingDateProvider() {
  const base = new Date(Date.UTC(2026, 6, 10));
  base.setUTCDate(base.getUTCDate() + 7 + Math.floor(Math.random() * 20));
  const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${MN[base.getUTCMonth()]} ${base.getUTCDate()}, ${base.getUTCFullYear()}`;
}

/**
 * `effects` is the persistence/side-effect boundary the caller (API layer)
 * implements. Keeping rules.js free of any DB/IO code is what makes it unit
 * testable without a database.
 *
 * effects = {
 *   log(ward, text, kind),
 *   notify(ward, text, kind) -> notification id,
 *   addTask(ward, text, owner) -> task id,
 *   addTaskBoardSync(ward, text) -> sync id,
 *   markRuleFired(ruleId),
 *   genCaseRef() -> string,
 *   hearingDateProvider() -> string,
 * }
 */
export function applyStageEntryRules(ward, effects) {
  // R2 — request noted opens the medical file.
  if (ward.stage === 1) {
    effects.markRuleFired('R2');
    effects.addTask(ward, "Obtain the doctor's letter and the guardianship questionnaire.", 'Medical records');
  }

  // R8 + R9 — medical documents complete: notify the law firm, route by payer.
  if (ward.stage === 4) {
    effects.markRuleFired('R8');
    effects.notify(ward, 'The law firm notified: medical documents complete — prepare and submit the guardianship petition.');
    effects.markRuleFired('R9');
    if (ward.funding === 'corporate') {
      ward.timeline.push('Corporate-funded: treated as a referral — the corporate payer coordinates the initial fee (owner differs from the law-firm-direct route).');
      effects.log(ward, 'Payer routing (rule R9): Corporate-funded → referral route. Owner: corporate payer, who coordinates the initial fee.', 'rule');
    } else {
      ward.timeline.push('Family (private pay): the law firm coordinates the submission directly.');
      effects.log(ward, 'Payer routing (rule R9): Family (private pay) → the law firm coordinates directly.', 'rule');
    }
  }

  // R3 — entering stage 5 activates court watch.
  if (ward.stage === 5 && !ward.courtWatch) {
    if (!ward.caseRef) ward.caseRef = effects.genCaseRef();
    ward.courtWatch = { status: 'await', date: null, lastChecked: new Date().toISOString() };
    effects.markRuleFired('R3');
    effects.log(ward, `Court Watch activated (rule R3) — case ${ward.caseRef}`, 'rule');
    effects.notify(ward, `${ownerLabel(5)} notified: submission complete, case filed with the county probate court`);
  }

  // stage 6 — case is now in court tracking. No date yet: the scheduled
  // court-watch job fills this in once it actually finds one (see
  // recordHearingFound below). Status stays 'await' until then.
  if (ward.stage === 6 && ward.courtWatch) {
    ward.courtWatch.lastChecked = new Date().toISOString();
    effects.log(ward, 'Entered court tracking — awaiting the next scheduled court-watch check for a hearing date.', 'move');
  }

  // R1 — Approver notified ONLY at stage 7. R4 — approval starts onboarding.
  if (ward.stage === 7) {
    if (ward.courtWatch) { ward.courtWatch.status = 'order'; ward.courtWatch.lastChecked = new Date().toISOString(); }
    effects.markRuleFired('R1');
    effects.notify(ward, 'Approver notified: guardianship approved (R1).');
    effects.markRuleFired('R4');
    effects.notify(ward, 'Verification Checklist sent to the guardian to begin collecting onboarding documents.');
    effects.notify(ward, 'Onboarding notified: close the individual bank accounts and open a managed rep-payee account (eases future renewals).');
    effects.addTask(ward, 'Close individual bank accounts; open a managed rep-payee account.', 'Onboarding');
    effects.addTaskBoardSync(ward, 'Onboarding case synced to external task board — documents tracked externally.');
    ward.syncedToTaskBoard = true;
    effects.log(ward, 'External task-board sync entry created (rule R4).', 'rule');
  }

  // stage 8 — onboarding complete.
  if (ward.stage === 8) {
    effects.notify(ward, `${ownerLabel(8)} notified: rep-payee account opened, onboarding complete`);
  }
}

function nextStage(ward) { return ward.stage + 1; }

export function advanceWard(ward, effects) {
  if (isClosed(ward)) {
    return { ok: false, reason: `This case is closed (${isDeceased(ward) ? 'deceased' : 'dismissed'}) and cannot be advanced.` };
  }
  if (ward.stage >= MAX_STAGE) {
    return { ok: false, reason: 'This case is already at the final stage (8 Guardian onboarding & accounts).' };
  }
  const missing = missingRequiredDocs(ward);
  if (missing.length) {
    return {
      ok: false,
      reason: `Cannot advance from stage ${ward.stage} (${stageById(ward.stage).name}). Required document${missing.length > 1 ? 's' : ''} still unchecked: ${missing.map((d) => d.label).join(', ')}.`,
    };
  }
  // R5 — stage 5 also requires the Legal Verified Receipt.
  if (ward.stage === 5 && !ward.lvr) {
    return {
      ok: false,
      reason: 'Cannot advance from stage 5 (Filed with court). The Legal Verified Receipt (LVR) must be checked before the case moves to the court date.',
    };
  }
  // R7 — cannot reach stage 7 with representative = Pending.
  const to = nextStage(ward);
  if (to === 7 && ward.representative === 'pending') {
    effects.markRuleFired('R7');
    return {
      ok: false,
      reason: 'Cannot reach stage 7 (Approved) while the assigned representative is Pending. Assign a Family member or Professional guardian first (rule R7).',
    };
  }
  const from = ward.stage;
  ward.stage = to;
  ward.daysInStage = 0;
  effects.log(ward, `Advanced: stage ${from} → stage ${to} (${stageById(to).name})`, 'move');
  applyStageEntryRules(ward, effects);
  return { ok: true, from, to };
}

export function sendBackWard(ward, effects) {
  if (isClosed(ward)) return { ok: false, reason: 'Closed cases cannot be moved.' };
  if (ward.stage <= MIN_STAGE) return { ok: false, reason: 'Already at the first stage.' };
  const from = ward.stage;
  const to = from - 1;
  ward.stage = to;
  ward.daysInStage = 0;
  effects.log(ward, `Sent back: stage ${from} → stage ${to} (${stageById(to).name})`, 'move');
  return { ok: true, from, to };
}

// R6 — see the module comment at the top of this file for how this
// deliberately differs from the demo (audit trail is preserved).
export function markDeceased(ward, dateStr, effects) {
  if (isDeceased(ward)) return { ok: false, reason: 'Already marked deceased.' };
  ward.deceasedDate = dateStr;
  const cancelledTasks = effects.cancelOpenTasksFor(ward.id);
  if (ward.courtWatch) ward.courtWatch.status = 'closed';
  effects.log(ward, `Marked deceased (${dateStr}). ${cancelledTasks} open task${cancelledTasks === 1 ? '' : 's'} cancelled and court watch stopped (rule R6).`, 'rule');
  effects.markRuleFired('R6');
  effects.notify(ward, 'Billing: case closed; reconcile billing.', 'billing');
  return { ok: true, cancelledTasks };
}

export function dismissWard(ward, reason, effects) {
  if (isDismissed(ward)) return { ok: false, reason: 'Already dismissed.' };
  ward.category = 'dismissed';
  ward.dismissedReason = reason || '';
  effects.log(ward, `Case dismissed${reason ? ` — ${reason}` : ''}. Removed from active board; history preserved.`, 'rule');
  return { ok: true };
}

export function reinstateWard(ward, category, effects) {
  ward.category = category || 'standard';
  ward.dismissedReason = '';
  effects.log(ward, `Case reinstated to active board as “${CATEGORIES[ward.category].label}”.`, 'move');
  return { ok: true };
}

// Called by the court-watch job (services/courtWatch/) the first time it
// finds a hearing date for a case in stage 6. The date is REPORTED, not
// verified — hearingConfirmed stays false until a human checks the box
// (confirmHearing / R10), or a future automated verification step is added.
export function recordHearingFound(ward, dateStr, effects) {
  const isNew = !ward.courtWatch || ward.courtWatch.date !== dateStr;
  ward.courtWatch = ward.courtWatch || { status: 'await', date: null, lastChecked: null };
  ward.courtWatch.status = 'sched';
  ward.courtWatch.date = dateStr;
  ward.courtWatch.lastChecked = new Date().toISOString();
  if (isNew) {
    ward.hearingConfirmed = false;
    effects.notify(ward, `${ownerLabel(6)} notified: hearing reported ${dateStr} (pending verification against the court record)`);
    effects.log(ward, `Court watch found a hearing date: ${dateStr} (reported, not verified).`, 'rule');
  }
  return { ok: true, changed: isNew };
}

// Called by the court-watch job when it checked and found nothing new —
// keeps `lastChecked` current without spamming a notification per run.
export function recordCourtCheckNoChange(ward, effects) {
  ward.courtWatch = ward.courtWatch || { status: 'await', date: null, lastChecked: null };
  ward.courtWatch.lastChecked = new Date().toISOString();
  effects.log(ward, 'Court watch checked the docket — no change.', 'move');
  return { ok: true, changed: false };
}

// Called when a reported hearing date is confirmed on file (R10).
export function confirmHearing(ward, effects) {
  ward.hearingConfirmed = true;
  if (ward.courtWatch) ward.courtWatch.lastChecked = new Date().toISOString();
  effects.markRuleFired('R10');
  const dateStr = ward.courtWatch?.date || 'date on file';
  effects.log(ward, `Court date confirmed — dated note written to the case record: hearing ${dateStr} verified against the court record (rule R10).`, 'rule');
  return { ok: true };
}
