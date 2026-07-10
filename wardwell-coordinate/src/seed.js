// Seeds the board with the same 9 synthetic wards the demo shipped with
// (WARD_SEED in coordinate.html), fully invented names/facilities, so the
// pilot has something to look at on first run. Run with `npm run seed`.
//
// This sets persistent state directly (timeline notes, LVR, court-watch
// initialization) rather than replaying every stage-entry rule, same as the
// demo's own seedWorld() — seeding is bootstrapping test data, not a real
// sequence of case events, so it should not fire notifications/tasks as if
// those events just happened.
import { randomUUID } from 'node:crypto';
import { openDb } from './db.js';
import { mkWard } from './rules.js';
import { saveWard, genCaseRef, insertLog } from './store.js';

const WARD_SEED = [
  { name: 'Harold Bennett', facility: 'Cedar Bluff Care Center', capacity: 'need', funding: 'family', stage: 1, category: 'standard', representative: 'pending' },
  { name: 'Margaret Alvarez', facility: 'Lindenwood Rehab', capacity: 'sign', funding: 'family', stage: 2, withholdCurrent: true, category: 'standard', representative: 'family', repName: 'niece, T. Alvarez' },
  { name: 'Frank Delgado', facility: 'Maple Terrace Nursing', capacity: 'need', funding: 'family', stage: 3, withholdCurrent: true, category: 'tough', representative: 'family', repName: 'son, R. Delgado' },
  { name: 'Patricia Holloway', facility: 'Riverstone Senior Living', capacity: 'need', funding: 'corporate', stage: 4, category: 'escalated', representative: 'professional' },
  { name: 'Robert Ashford', facility: 'Birchwood Manor', capacity: 'need', funding: 'family', stage: 5, category: 'protective', representative: 'professional' },
  { name: 'Eleanor Prescott', facility: 'Hollowmere Care Home', capacity: 'sign', funding: 'corporate', stage: 6, category: 'standard', representative: 'professional' },
  { name: 'Walter Tillman', facility: 'Stonegate Assisted Living', capacity: 'need', funding: 'family', stage: 7, category: 'standard', representative: 'family', repName: 'daughter, M. Tillman' },
  { name: 'Dorothy Langston', facility: 'Fairhaven Care Center', capacity: 'self', funding: 'family', stage: 8, category: 'standard', representative: 'professional' },
  { name: 'Raymond Coleman', facility: 'Wexford Nursing Home', capacity: 'need', funding: 'corporate', stage: 4, optionalOn: true, category: 'escalated', representative: 'professional' },
];

export function seedWorld(db) {
  for (const o of WARD_SEED) {
    const ward = mkWard({ id: `W-${randomUUID().slice(0, 8)}`, ...o });

    if (ward.stage >= 4) {
      ward.timeline.push(ward.funding === 'corporate'
        ? 'Corporate-funded: treated as a referral — the corporate payer coordinates the initial fee (owner differs from the law-firm-direct route).'
        : 'Family (private pay): the law firm coordinates the submission directly.');
    }
    if (ward.stage === 5 || ward.stage === 6) {
      ward.caseRef = genCaseRef();
      ward.courtWatch = {
        status: ward.stage === 6 ? 'sched' : 'await',
        date: ward.stage === 6 ? 'Jul 22, 2026' : null,
        lastChecked: new Date().toISOString(),
      };
    }
    if (ward.stage > 5) ward.lvr = true;
    if (ward.stage === 6) ward.hearingConfirmed = false;
    if (ward.stage >= 7) ward.syncedToTaskBoard = true;

    saveWard(db, ward);
    insertLog(db, ward.id, 'Seeded synthetic case.', 'move');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const db = openDb();
  seedWorld(db);
  console.log(`Seeded ${WARD_SEED.length} synthetic wards.`);
}
