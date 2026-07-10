import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import {
  advanceWard, sendBackWard, markDeceased, dismissWard, reinstateWard,
  confirmHearing, RULES, STAGES, CATEGORIES, CAPACITY, FUNDING, REPS, CADENCE,
  mkWard, applyStageEntryRules, defaultHearingDateProvider,
} from '../rules.js';
import {
  saveWard, getWard, listWards, createEffects, listLog,
  listFiredRuleIds, insertLog, genCaseRef,
} from '../store.js';
import { importCSV, CSV_HEADER } from '../csv.js';
import { config } from '../config.js';

function docLabelForKey(k) {
  for (const s of STAGES) {
    const d = s.docs.find((x) => x.k === k);
    if (d) return d.label;
  }
  return null;
}

export function wardsRouter(db) {
  const router = Router();

  router.get('/meta', (req, res) => {
    res.json({
      stages: STAGES, categories: CATEGORIES, capacity: CAPACITY,
      funding: FUNDING, representatives: REPS, cadence: CADENCE,
      rules: RULES, firedRuleIds: listFiredRuleIds(db),
      csvHeader: CSV_HEADER,
      courtWatchProvider: config.courtWatch.provider,
      courtWatchEnabled: config.courtWatch.enabled,
    });
  });

  router.get('/wards', (req, res) => {
    res.json(listWards(db).map((w) => ({ ...w, log: listLog(db, w.id) })));
  });

  router.get('/wards/:id', (req, res) => {
    const w = getWard(db, req.params.id);
    if (!w) return res.status(404).json({ error: 'not found' });
    res.json({ ...w, log: listLog(db, w.id) });
  });

  router.post('/wards', (req, res) => {
    const body = req.body || {};
    if (!body.name || !body.facility) return res.status(400).json({ error: 'name and facility are required' });
    const ward = mkWard({
      id: `W-${randomUUID().slice(0, 8)}`,
      name: body.name,
      facility: body.facility,
      capacity: body.capacity,
      funding: body.funding,
      stage: 1,
      category: body.category,
      representative: body.representative,
      repName: body.repName,
    });
    saveWard(db, ward);
    const effects = createEffects(db, ward);
    applyStageEntryRules(ward, effects); // fires R2 (opens the medical-docs task)
    saveWard(db, ward);
    res.status(201).json({ ...ward, log: listLog(db, ward.id) });
  });

  function withWard(handler) {
    return (req, res) => {
      const ward = getWard(db, req.params.id);
      if (!ward) return res.status(404).json({ error: 'not found' });
      handler(req, res, ward);
    };
  }

  router.post('/wards/:id/advance', withWard((req, res, ward) => {
    const effects = createEffects(db, ward);
    const result = advanceWard(ward, effects);
    if (!result.ok) return res.status(409).json({ ok: false, reason: result.reason });
    saveWard(db, ward);
    res.json({ ok: true, ward: { ...ward, log: listLog(db, ward.id) } });
  }));

  router.post('/wards/:id/send-back', withWard((req, res, ward) => {
    const effects = createEffects(db, ward);
    const result = sendBackWard(ward, effects);
    if (!result.ok) return res.status(409).json({ ok: false, reason: result.reason });
    saveWard(db, ward);
    res.json({ ok: true, ward: { ...ward, log: listLog(db, ward.id) } });
  }));

  router.post('/wards/:id/deceased', withWard((req, res, ward) => {
    const date = (req.body || {}).date;
    if (!date) return res.status(400).json({ error: 'date is required' });
    const effects = createEffects(db, ward);
    const result = markDeceased(ward, date, effects);
    if (!result.ok) return res.status(409).json({ ok: false, reason: result.reason });
    saveWard(db, ward);
    res.json({ ok: true, ward: { ...ward, log: listLog(db, ward.id) } });
  }));

  router.post('/wards/:id/dismiss', withWard((req, res, ward) => {
    const reason = (req.body || {}).reason || '';
    const effects = createEffects(db, ward);
    const result = dismissWard(ward, reason, effects);
    if (!result.ok) return res.status(409).json({ ok: false, reason: result.reason });
    saveWard(db, ward);
    res.json({ ok: true, ward: { ...ward, log: listLog(db, ward.id) } });
  }));

  router.post('/wards/:id/reinstate', withWard((req, res, ward) => {
    const category = (req.body || {}).category || 'standard';
    const effects = createEffects(db, ward);
    reinstateWard(ward, category, effects);
    saveWard(db, ward);
    res.json({ ok: true, ward: { ...ward, log: listLog(db, ward.id) } });
  }));

  router.post('/wards/:id/confirm-hearing', withWard((req, res, ward) => {
    if (!ward.courtWatch || !ward.courtWatch.date) {
      return res.status(409).json({ ok: false, reason: 'No reported hearing date to confirm yet.' });
    }
    const effects = createEffects(db, ward);
    confirmHearing(ward, effects);
    saveWard(db, ward);
    res.json({ ok: true, ward: { ...ward, log: listLog(db, ward.id) } });
  }));

  // Direct field edits the demo exposed inline (category, representative,
  // capacity, funding, court-watch cadence, LVR checkbox, doc checkboxes).
  // These don't run rule logic themselves — they're state a human enters —
  // but they ARE logged, same as the demo's logEntry() calls.
  router.patch('/wards/:id', withWard((req, res, ward) => {
    const b = req.body || {};
    const closedFields = ['category', 'representative', 'repName', 'capacity', 'funding', 'lvr', 'courtCadence', 'docs'];
    if (ward.deceasedDate || ward.category === 'dismissed') {
      return res.status(409).json({ ok: false, reason: 'Closed cases cannot be edited.' });
    }
    if (b.category !== undefined && b.category !== 'dismissed') {
      ward.category = b.category;
      insertLog(db, ward.id, `Category set to "${CATEGORIES[ward.category]?.label || ward.category}"`, 'move');
    }
    if (b.representative !== undefined) {
      ward.representative = b.representative;
      if (ward.representative !== 'family') ward.repName = '';
      insertLog(db, ward.id, `Representative set to "${REPS[ward.representative]?.label || ward.representative}"`, 'move');
    }
    if (b.repName !== undefined && ward.representative === 'family') ward.repName = b.repName;
    if (b.capacity !== undefined) {
      ward.capacity = b.capacity;
      insertLog(db, ward.id, `Capacity set to "${CAPACITY[ward.capacity]?.label || ward.capacity}"`, 'move');
    }
    if (b.funding !== undefined) {
      ward.funding = b.funding;
      insertLog(db, ward.id, `Funding path set to "${FUNDING[ward.funding]?.label || ward.funding}"`, 'move');
    }
    if (b.lvr !== undefined) {
      ward.lvr = !!b.lvr;
      insertLog(db, ward.id, ward.lvr ? 'Legal Verified Receipt confirmed' : 'Legal Verified Receipt un-confirmed', 'move');
    }
    if (b.courtCadence !== undefined && CADENCE[b.courtCadence]) {
      ward.courtCadence = b.courtCadence;
      if (ward.courtWatch) ward.courtWatch.lastChecked = new Date().toISOString();
      insertLog(db, ward.id, `Court-watch cadence set to "${CADENCE[ward.courtCadence].label}".`, 'move');
    }
    if (b.docs && typeof b.docs === 'object') {
      // A doc key is valid if it belongs to ANY stage's checklist — not just
      // keys already present on this ward. A newly-arrived stage's docs
      // aren't pre-seeded onto ward.docs, so requiring pre-existence here
      // would make it impossible to ever check them off.
      for (const [k, v] of Object.entries(b.docs)) {
        const label = docLabelForKey(k);
        if (!label) continue; // not a real document key — ignore silently
        ward.docs[k] = !!v;
        insertLog(db, ward.id, `${v ? 'Document checked' : 'Document unchecked'}: ${label}`, 'move');
      }
    }
    saveWard(db, ward);
    res.json({ ok: true, ward: { ...ward, log: listLog(db, ward.id) } });
  }));

  router.post('/import', (req, res) => {
    const csvText = (req.body || {}).csv;
    if (typeof csvText !== 'string') return res.status(400).json({ ok: false, message: 'Expected { csv: "<raw csv text>" }' });
    const result = importCSV(csvText, {
      genId: () => `I-${randomUUID().slice(0, 8)}`,
      genCaseRef,
      hearingDateProvider: defaultHearingDateProvider,
    });
    if (!result.ok) return res.status(400).json(result);
    for (const { ward, rowNo } of result.wards) {
      saveWard(db, ward);
      insertLog(db, ward.id, `Imported from CSV (row ${rowNo}).`, 'move');
    }
    res.status(201).json({ ok: true, imported: result.imported, warnings: result.warnings });
  });

  return router;
}
