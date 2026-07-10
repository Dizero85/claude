import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { config } from './config.js';

export const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS wards (
    id                  TEXT PRIMARY KEY,
    name                TEXT NOT NULL,
    facility            TEXT NOT NULL,
    capacity            TEXT NOT NULL DEFAULT 'need',
    funding             TEXT NOT NULL DEFAULT 'family',
    stage               INTEGER NOT NULL DEFAULT 1,
    days_in_stage       INTEGER NOT NULL DEFAULT 0,
    case_ref            TEXT,
    category            TEXT NOT NULL DEFAULT 'standard',
    representative      TEXT NOT NULL DEFAULT 'pending',
    rep_name            TEXT NOT NULL DEFAULT '',
    lvr                 INTEGER NOT NULL DEFAULT 0,
    hearing_confirmed   INTEGER NOT NULL DEFAULT 0,
    court_cadence       TEXT NOT NULL DEFAULT 'weekly',
    synced_to_task_board INTEGER NOT NULL DEFAULT 0,
    deceased_date       TEXT,
    dismissed_reason    TEXT NOT NULL DEFAULT '',
    docs                TEXT NOT NULL DEFAULT '{}',
    timeline            TEXT NOT NULL DEFAULT '[]',
    court_watch         TEXT,
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ward_log (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    ward_id  TEXT NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
    time     TEXT NOT NULL,
    text     TEXT NOT NULL,
    kind     TEXT NOT NULL DEFAULT 'move',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id       TEXT PRIMARY KEY,
    ward_id  TEXT REFERENCES wards(id) ON DELETE SET NULL,
    text     TEXT NOT NULL,
    kind     TEXT NOT NULL DEFAULT 'rule',
    sent_via TEXT NOT NULL DEFAULT 'log',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id       TEXT PRIMARY KEY,
    ward_id  TEXT REFERENCES wards(id) ON DELETE SET NULL,
    text     TEXT NOT NULL,
    owner    TEXT NOT NULL,
    cancelled INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS task_board_syncs (
    id       TEXT PRIMARY KEY,
    ward_id  TEXT REFERENCES wards(id) ON DELETE SET NULL,
    text     TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS fired_rules (
    rule_id  TEXT PRIMARY KEY,
    first_fired_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS court_watch_checks (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    ward_id    TEXT NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
    status     TEXT NOT NULL,
    detail     TEXT NOT NULL DEFAULT '',
    checked_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

export function applySchema(db) {
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA_SQL);
  return db;
}

export function openDb(dbPath = config.databasePath) {
  if (dbPath !== ':memory:') mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  return applySchema(db);
}
