import { Router } from 'express';
import { runCourtWatchSweep } from '../services/courtWatch/scheduler.js';
import { listWardsForCourtWatch, listCourtWatchChecks } from '../store.js';
import { config } from '../config.js';

export function courtWatchRouter(db) {
  const router = Router();

  router.get('/court-watch', (req, res) => {
    const wards = listWardsForCourtWatch(db);
    res.json(wards.map((w) => ({
      wardId: w.id, name: w.name, facility: w.facility, caseRef: w.caseRef,
      courtWatch: w.courtWatch, hearingConfirmed: w.hearingConfirmed,
      courtCadence: w.courtCadence, checks: listCourtWatchChecks(db, w.id, 5),
    })));
  });

  // Manual/demo trigger — the real scheduler runs this hourly on its own
  // (see services/courtWatch/scheduler.js); this lets the pilot demo show
  // "run the check now" without waiting on cron, and lets `force=true`
  // bypass the per-case cadence for a live walkthrough.
  router.post('/court-watch/run', async (req, res) => {
    const force = !!(req.body || {}).force;
    const providerName = (req.body || {}).provider || config.courtWatch.provider;
    const results = await runCourtWatchSweep(db, { providerName, force });
    res.json({ ok: true, provider: providerName, results });
  });

  return router;
}
