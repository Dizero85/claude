// Data access + the effects factory that binds rules.js (pure, DB-free) to
// SQLite and the alerts service. This is the only place that knows about
// both at once.
import { randomUUID } from 'node:crypto';
import { mkWard, defaultHearingDateProvider } from './rules.js';
import { sendAlert } from './services/alerts.js';

function rowToWard(row) {
  if (!row) return null;
  return mkWard({
    id: row.id,
    name: row.name,
    facility: row.facility,
    capacity: row.capacity,
    funding: row.funding,
    stage: row.stage,
    daysInStage: row.days_in_stage,
    caseRef: row.case_ref,
    category: row.category,
    representative: row.representative,
    repName: row.rep_name,
    lvr: !!row.lvr,
    hearingConfirmed: !!row.hearing_confirmed,
    courtCadence: row.court_cadence,
    syncedToTaskBoard: !!row.synced_to_task_board,
    deceasedDate: row.deceased_date,
    dismissedReason: row.dismissed_reason,
    docs: JSON.parse(row.docs || '{}'),
    timeline: JSON.parse(row.timeline || '[]'),
    courtWatch: row.court_watch ? JSON.parse(row.court_watch) : null,
  });
}

const UPSERT_SQL = `
  INSERT INTO wards (
    id, name, facility, capacity, funding, stage, days_in_stage, case_ref,
    category, representative, rep_name, lvr, hearing_confirmed,
    court_cadence, synced_to_task_board, deceased_date, dismissed_reason,
    docs, timeline, court_watch, updated_at
  ) VALUES (
    :id, :name, :facility, :capacity, :funding, :stage, :daysInStage, :caseRef,
    :category, :representative, :repName, :lvr, :hearingConfirmed,
    :courtCadence, :syncedToTaskBoard, :deceasedDate, :dismissedReason,
    :docs, :timeline, :courtWatch, datetime('now')
  )
  ON CONFLICT(id) DO UPDATE SET
    name=excluded.name, facility=excluded.facility, capacity=excluded.capacity,
    funding=excluded.funding, stage=excluded.stage, days_in_stage=excluded.days_in_stage,
    case_ref=excluded.case_ref, category=excluded.category,
    representative=excluded.representative, rep_name=excluded.rep_name,
    lvr=excluded.lvr, hearing_confirmed=excluded.hearing_confirmed,
    court_cadence=excluded.court_cadence, synced_to_task_board=excluded.synced_to_task_board,
    deceased_date=excluded.deceased_date, dismissed_reason=excluded.dismissed_reason,
    docs=excluded.docs, timeline=excluded.timeline, court_watch=excluded.court_watch,
    updated_at=datetime('now')
`;

function wardParams(ward) {
  return {
    id: ward.id,
    name: ward.name,
    facility: ward.facility,
    capacity: ward.capacity,
    funding: ward.funding,
    stage: ward.stage,
    daysInStage: ward.daysInStage,
    caseRef: ward.caseRef,
    category: ward.category,
    representative: ward.representative,
    repName: ward.repName,
    lvr: ward.lvr ? 1 : 0,
    hearingConfirmed: ward.hearingConfirmed ? 1 : 0,
    courtCadence: ward.courtCadence,
    syncedToTaskBoard: ward.syncedToTaskBoard ? 1 : 0,
    deceasedDate: ward.deceasedDate,
    dismissedReason: ward.dismissedReason,
    docs: JSON.stringify(ward.docs),
    timeline: JSON.stringify(ward.timeline),
    courtWatch: ward.courtWatch ? JSON.stringify(ward.courtWatch) : null,
  };
}

export function saveWard(db, ward) {
  db.prepare(UPSERT_SQL).run(wardParams(ward));
  return ward;
}

export function getWard(db, id) {
  const row = db.prepare('SELECT * FROM wards WHERE id = ?').get(id);
  return rowToWard(row);
}

export function listWards(db) {
  return db.prepare('SELECT * FROM wards ORDER BY created_at ASC').all().map(rowToWard);
}

/** Active wards with a court-watch entry that isn't closed (used by the scheduler). */
export function listWardsForCourtWatch(db) {
  return db.prepare(`
    SELECT * FROM wards
    WHERE deceased_date IS NULL AND category != 'dismissed'
      AND court_watch IS NOT NULL
      AND stage IN (5, 6)
  `).all().map(rowToWard);
}

export function insertLog(db, wardId, text, kind) {
  db.prepare('INSERT INTO ward_log (ward_id, time, text, kind) VALUES (?, ?, ?, ?)')
    .run(wardId, new Date().toISOString(), text, kind || 'move');
}
export function listLog(db, wardId) {
  return db.prepare('SELECT time, text, kind FROM ward_log WHERE ward_id = ? ORDER BY id ASC').all(wardId);
}

export function insertNotification(db, { wardId, text, kind }) {
  const id = `N-${randomUUID().slice(0, 8)}`;
  db.prepare('INSERT INTO notifications (id, ward_id, text, kind, sent_via) VALUES (?, ?, ?, ?, ?)')
    .run(id, wardId || null, text, kind || 'rule', 'log');
  return id;
}
export function markNotificationSentVia(db, id, sentVia) {
  db.prepare('UPDATE notifications SET sent_via = ? WHERE id = ?').run(sentVia, id);
}
export function listNotifications(db, limit = 200) {
  return db.prepare('SELECT * FROM notifications ORDER BY created_at DESC LIMIT ?').all(limit);
}

export function insertTask(db, { wardId, text, owner }) {
  const id = `T-${randomUUID().slice(0, 8)}`;
  db.prepare('INSERT INTO tasks (id, ward_id, text, owner) VALUES (?, ?, ?, ?)').run(id, wardId || null, text, owner);
  return id;
}
export function listTasks(db) {
  return db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
}
export function cancelOpenTasksFor(db, wardId) {
  const res = db.prepare('UPDATE tasks SET cancelled = 1 WHERE ward_id = ? AND cancelled = 0').run(wardId);
  return res.changes;
}

export function insertSync(db, { wardId, text }) {
  const id = `S-${randomUUID().slice(0, 8)}`;
  db.prepare('INSERT INTO task_board_syncs (id, ward_id, text) VALUES (?, ?, ?)').run(id, wardId || null, text);
  return id;
}
export function listSyncs(db) {
  return db.prepare('SELECT * FROM task_board_syncs ORDER BY created_at DESC').all();
}

export function markRuleFired(db, ruleId) {
  db.prepare('INSERT OR IGNORE INTO fired_rules (rule_id) VALUES (?)').run(ruleId);
}
export function listFiredRuleIds(db) {
  return db.prepare('SELECT rule_id FROM fired_rules').all().map((r) => r.rule_id);
}

export function insertCourtWatchCheck(db, { wardId, status, detail }) {
  db.prepare('INSERT INTO court_watch_checks (ward_id, status, detail) VALUES (?, ?, ?)')
    .run(wardId, status, detail || '');
}
export function countCourtWatchChecks(db, wardId) {
  return db.prepare('SELECT COUNT(*) AS c FROM court_watch_checks WHERE ward_id = ?').get(wardId).c;
}
export function listCourtWatchChecks(db, wardId, limit = 20) {
  return db.prepare('SELECT * FROM court_watch_checks WHERE ward_id = ? ORDER BY checked_at DESC LIMIT ?').all(wardId, limit);
}

export function genCaseRef() {
  return `PB-2026-0${4400 + Math.floor(Math.random() * 599)}`;
}

/**
 * Builds the effects object rules.js expects, bound to one db + one ward.
 * `notify` sends a real (or logged) alert via the alerts service without
 * blocking the caller — the notification row is written synchronously so
 * the API response is consistent, and sent_via is updated once the async
 * send settles.
 */
export function createEffects(db, ward) {
  return {
    log: (w, text, kind) => insertLog(db, w.id, text, kind),
    notify: (w, text, kind) => {
      const id = insertNotification(db, { wardId: w.id, text, kind });
      sendAlert({ subject: kind === 'billing' ? 'Billing' : 'Case update', text, ward: w })
        .then(({ sentVia }) => markNotificationSentVia(db, id, sentVia))
        .catch(() => {});
      return id;
    },
    addTask: (w, text, owner) => insertTask(db, { wardId: w.id, text, owner }),
    addTaskBoardSync: (w, text) => insertSync(db, { wardId: w.id, text }),
    markRuleFired: (ruleId) => markRuleFired(db, ruleId),
    genCaseRef,
    cancelOpenTasksFor: (wardId) => cancelOpenTasksFor(db, wardId),
    hearingDateProvider: defaultHearingDateProvider,
  };
}
