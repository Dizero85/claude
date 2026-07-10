# Wardwell Coordinate — pilot backend

A real, working version of the guardianship-coordination tracker from the
MedicaidSoft pitch materials (`02_suite_wardwell/coordinate.html`). That
file was a single-page **offline demo**: everything — the rules engine,
the "court watch," the notification feed — ran in the browser, in memory,
and vanished on refresh. Nothing there checked a real court calendar or
sent a real email.

This is the next step: a small server with a real database, a rules
engine that runs once (server-side, not editable via devtools), a
scheduled job that actually checks a court calendar, and real email
alerts with a safe fallback. It's sized like the pilot in
`04_commercial/engagement_proposal.html` §2 — one state, synthetic cases,
a working demo — not a production system yet.

## Quick start

```bash
npm install
npm run seed    # loads 9 synthetic wards, same as the demo's WARD_SEED
npm start        # http://localhost:3000
```

Open `http://localhost:3000`. No `.env` file is required — every setting
has a safe default (see `.env.example`): court watch runs against a mock
provider (no network calls) and alerts print to the console instead of
sending email.

Run the test suite (rules engine, CSV importer, DB persistence — 26 tests):

```bash
npm test
```

## What's real here vs. what's still a demo

| Piece | Status |
|---|---|
| Rules engine (R1–R10) | **Real.** Runs server-side in `src/rules.js`, unit-tested. The frontend can't bypass it — every action is an API call the server validates. |
| Database | **Real.** SQLite (`node:sqlite`, built into Node 22+, zero native deps) — `src/db.js`. Cases, notifications, tasks, logs all persist across restarts. |
| CSV import | **Real.** Same column layout as the demo (`samples/sample_cases.csv`), parsed and validated server-side (`src/csv.js`). |
| Scheduled court-watch job | **Real scheduler, mock data by default.** `src/services/courtWatch/scheduler.js` runs hourly via cron and enforces each case's cadence (Daily / Every 4 days / Weekly). The provider it calls is swappable — see below. |
| Utah courts provider | **Written, not verified against the live site.** See "Court watch: what's real" below — this is the one piece that genuinely could not be finished from this environment. |
| Email alerts | **Real**, with a console fallback. Set `SMTP_*` and `ALERT_TO` in `.env` to send real email; unset, alerts still fire and get logged (`src/services/alerts.js`). |

## Court watch: what's real, what isn't, and why

The pitch material's honesty note says: *"the calendar automation was
validated against the public main court site, which responds to standard
requests."* I could not repeat that validation here — **this sandboxed
session's network policy blocks outbound requests to `utcourts.gov`
outright** (confirmed via the proxy's own status log: a `connect_rejected`
policy denial before the request ever left this environment, not a
response from the court site). `WebFetch` and `curl` both hit the same
wall. I could not so much as load `example.com` from here — external
fetch is not available in this session at all.

So:

- **`src/services/courtWatch/mockProvider.js`** is the default
  (`COURT_WATCH_PROVIDER=mock`). It makes no network calls, is safe to
  run anywhere, and is what the demo above ran on. It's what lets the
  whole scheduler → discovery → notification → confirmation loop be
  demonstrated for real, end to end, without a live court site.

- **`src/services/courtWatch/utahCourtsProvider.js`** is a real attempt at
  Utah's free, no-login "Find a Hearing" calendar (confirmed via web
  search to be the right free tool — not the paid XChange case lookup,
  which is a different system and costs money per search). But the exact
  request shape and HTML structure are **unverified guesses**, clearly
  marked `TODO(verify)` in the file, because I never got to see the real
  page. Flipping `COURT_WATCH_PROVIDER=utah` runs this for real and will
  likely fail loudly (by design — it throws on a bad response rather than
  quietly reporting "not found").

**Before trusting the Utah provider on a real case**, from a machine with
normal internet access:
1. Open the Find a Hearing page, open devtools → Network, run a real
   search, and capture the actual request/response.
2. Fix `buildSearchUrl()` / `parseResults()` in `utahCourtsProvider.js` to
   match what you captured.
3. Test it against a real case before switching a production case's
   `COURT_WATCH_PROVIDER` away from `mock`.

This is a half-day of work for someone with a normal internet connection,
not a redesign — the scheduler, cadence enforcement, discovery/change
detection, and notification logic around it are already real and tested.

## Two deliberate differences from the original demo

Both are called out in code comments where they happen (`src/rules.js`):

1. **R6 (deceased case cleanup).** The demo *deleted* notification history
   from the in-browser feed when a ward was marked deceased. That's fine
   for a toy, wrong for a real audit trail. Here, marking deceased stops
   future work (cancels open tasks, halts court watch) and fires the
   Billing notification, but never deletes a sent notification.

2. **Stage 6 hearing dates.** The demo *fabricated* a hearing date the
   instant a case entered stage 6, because there was no real scheduler
   behind it. Here, entering stage 6 just marks the case as awaiting its
   next scheduled check — the date only appears once the court-watch job
   (mock or real) actually reports one. This is what makes the scheduler
   demo above meaningful instead of decorative.

## API

All under `/api`. A few worth knowing:

- `GET /api/meta` — stages, categories, rule catalog, which rules have
  fired, court-watch provider/enabled state.
- `GET /api/wards`, `POST /api/wards`, `GET/PATCH /api/wards/:id`
- `POST /api/wards/:id/advance` / `/send-back` / `/deceased` / `/dismiss`
  / `/reinstate` / `/confirm-hearing` — every one enforces the same rules
  as `src/rules.js`; a blocked action returns `409` with a plain-English
  `reason`, same wording as the demo used to show inline.
- `POST /api/import` — `{ "csv": "<raw text>" }`, same header contract as
  the demo.
- `GET /api/court-watch`, `POST /api/court-watch/run` — the real board
  and a manual trigger (the scheduler itself runs hourly on its own; this
  is for demos or forcing an out-of-cycle check with `{"force": true}`).

## Project layout

```
src/
  rules.js              pure rules engine — no DB, no IO, fully unit tested
  csv.js                CSV parser + importer, ported from the demo
  db.js / store.js       SQLite schema + the effects bridge into rules.js
  config.js               env var loading with safe defaults
  routes/                 Express routes
  services/alerts.js       email w/ console fallback
  services/courtWatch/    scheduler + mock provider + Utah provider
public/                  frontend — calls the API, holds no business logic
samples/sample_cases.csv  same sample data as the original demo
test/                     26 tests: rules engine, CSV, DB persistence
```

## Environment variables

See `.env.example` for the full list with defaults. Nothing is required
to run locally.
