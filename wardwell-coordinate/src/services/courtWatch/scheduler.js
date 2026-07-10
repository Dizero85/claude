import cron from 'node-cron';
import { config } from '../../config.js';
import { recordHearingFound, recordCourtCheckNoChange, CADENCE } from '../../rules.js';
import {
  listWardsForCourtWatch, createEffects, saveWard,
  insertCourtWatchCheck, countCourtWatchChecks,
} from '../../store.js';
import { mockCheckHearing } from './mockProvider.js';
import { utahCheckHearing } from './utahCourtsProvider.js';

const PROVIDERS = { mock: mockCheckHearing, utah: utahCheckHearing };

function isDue(ward) {
  if (!ward.courtWatch || !ward.courtWatch.lastChecked) return true;
  const hours = CADENCE[ward.courtCadence]?.hours ?? CADENCE.weekly.hours;
  const last = new Date(ward.courtWatch.lastChecked).getTime();
  return Date.now() - last >= hours * 3600 * 1000;
}

/** Runs one pass over every active, court-watched case that's due for a check. */
export async function runCourtWatchSweep(db, { providerName = config.courtWatch.provider, force = false } = {}) {
  const checkFn = PROVIDERS[providerName] || PROVIDERS.mock;
  const wards = listWardsForCourtWatch(db);
  const results = [];
  for (const ward of wards) {
    if (!force && !isDue(ward)) { results.push({ wardId: ward.id, status: 'skipped-not-due' }); continue; }
    const effects = createEffects(db, ward);
    const checkCount = countCourtWatchChecks(db, ward.id);
    let outcome;
    try {
      outcome = await checkFn({ ward, checkCount });
    } catch (err) {
      insertCourtWatchCheck(db, { wardId: ward.id, status: 'error', detail: err.message });
      results.push({ wardId: ward.id, status: 'error', error: err.message });
      continue;
    }
    if (outcome.found) {
      const r = recordHearingFound(ward, outcome.date, effects);
      insertCourtWatchCheck(db, { wardId: ward.id, status: 'found', detail: outcome.raw || outcome.date });
      results.push({ wardId: ward.id, status: 'found', changed: r.changed, date: outcome.date });
    } else {
      recordCourtCheckNoChange(ward, effects);
      insertCourtWatchCheck(db, { wardId: ward.id, status: 'no-match', detail: outcome.raw || '' });
      results.push({ wardId: ward.id, status: 'no-match' });
    }
    saveWard(db, ward);
  }
  return results;
}

/** Starts the hourly cron sweep. Per-case cadence (daily/every-4-days/weekly)
 *  is enforced inside runCourtWatchSweep via isDue(), not by the cron
 *  interval itself — the cron just decides how often we're willing to look. */
export function startCourtWatchScheduler(db) {
  if (!config.courtWatch.enabled) {
    console.log('[court-watch] disabled (COURT_WATCH_ENABLED=false in .env). POST /api/court-watch/run still works for manual/demo triggers.');
    return null;
  }
  const task = cron.schedule('0 * * * *', () => {
    runCourtWatchSweep(db).catch((err) => console.error('[court-watch] sweep failed:', err));
  });
  console.log(`[court-watch] scheduler started — provider=${config.courtWatch.provider}, hourly sweep, per-case cadence enforced.`);
  return task;
}
