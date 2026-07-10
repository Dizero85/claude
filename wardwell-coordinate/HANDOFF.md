# Handoff notes — Wardwell Coordinate

Plain-language summary for whoever picks this up next (a teammate, or Claude
in another workspace). Full technical detail is in `README.md`.

## What this is

A working pilot of a guardianship case-tracking board with an automated
"court watch" that finds hearing dates so nobody has to check the court
website by hand. It started as an offline browser mockup; this project is the
real version with a database, a server-side rules engine, a scheduled
court-watch job, and email alerts.

## What's already done and working

- **Case board** — 8-stage pipeline, drag-free advance/send-back, document
  checklists that block a case from moving with missing paperwork.
- **Rules engine (R1–R10)** — runs on the server, fully tested (26 automated
  tests, all passing: run `npm test`).
- **Court-watch scheduler** — checks each case on its own cadence and posts
  found hearing dates as "reported, not verified." Runs on a built-in mock
  (fake) court source by default so it works anywhere with no setup.
- **Email alerts** — real email when configured; otherwise logs to console.
- **CSV import** — load a spreadsheet of cases; same format as `samples/sample_cases.csv`.
- **Standalone demo** — `demo/index.html` opens in any browser with no server
  (this is the file used for stakeholder demos).

## The two things NOT finished

1. **Real Utah court connection.** The court-watch's live Utah provider
   (`src/services/courtWatch/utahCourtsProvider.js`) is written but UNVERIFIED
   — it was built in a sandbox that had no internet access to utcourts.gov, so
   the exact request/response was never captured. It's marked `TODO(verify)`.
   Finishing it is ~half a day for someone on a normal internet connection
   (capture the real request in browser devtools, adjust the two placeholder
   functions, test against a real case). Until then, keep the mock provider.

2. **Deployment for team use.** Today the app runs on one machine
   (`npm start` → localhost). For a whole team to share one live board, it
   needs to be hosted on a server everyone can reach. See below.

## How to run it locally

```bash
npm install
npm run seed     # loads sample cases
npm start        # open http://localhost:3000
npm test         # run the test suite
```

## To let a whole team use it (deployment)

The app is already built for shared use — one database, server-side rules, a
scheduled job — so multi-user is a hosting step, not a rewrite:

1. Put it on a small cloud host (Render, Railway, Fly.io, a VPS, or the
   company's own server).
2. Point everyone at that one URL — they all see and edit the same live board.
3. Set the email settings (`.env`, see `.env.example`) so alerts go out.
4. Finish the real Utah court connection (item 1 above) before trusting
   court-watch on real cases.

The database is SQLite (a single file) — fine for a small team pilot. For a
larger rollout, swap it for Postgres (the data layer is isolated in
`src/store.js`, so this is a contained change).
