// Real court-watch provider for Utah's public "Find a Hearing" calendar.
//
// STATUS: WRITTEN, NOT VERIFIED AGAINST THE LIVE SITE. Read this whole
// comment before flipping COURT_WATCH_PROVIDER to "utah".
//
// This code was developed inside a sandboxed session whose network egress
// policy blocks utcourts.gov outright — both `curl` and the fetch tooling
// got a 403 from the *organization's proxy*, not from the court site
// itself (confirmed via the proxy's own status log, which recorded it as
// `connect_rejected` / policy denial before the request ever reached
// utcourts.gov). So the exact request shape and HTML structure below could
// not be captured or tested from here. Everything is built from public,
// third-party descriptions of the flow: utcourts.gov -> Self-Help -> "Find
// a Hearing" is a free, no-login calendar search where you pick a court
// level (district/justice), a judicial district, and a date. (The separate
// XChange case-lookup tool is NOT this — XChange costs money per search and
// is a different system; don't wire that in by mistake.)
//
// Before trusting this in production, from a machine with real internet
// access:
//   1. Open https://www.utcourts.gov/en/self-help/case-categories/find-a-hearing.html,
//      open browser devtools -> Network tab, run a real search for a known
//      case/date, and capture the exact request (URL, method, params) and
//      the response HTML.
//   2. Update FIND_A_HEARING_PATH / buildSearchUrl() / parseResults() below
//      to match what you captured. The TODO(verify) comments mark every
//      guess.
//   3. Point test/utahCourtsProvider.contract.md (next to this file) at a
//      saved real HTML fixture and get parseResults() passing against it
//      before ever running this against production cases.
//
// Until that happens, keep COURT_WATCH_PROVIDER=mock (the .env.example
// default). This file intentionally throws on a non-2xx response instead
// of silently returning "not found" — a real failure should look like a
// failure, not a quiet false negative on someone's hearing date.

import * as cheerio from 'cheerio';

const BASE_URL = 'https://www.utcourts.gov';
// TODO(verify): confirm this is the real path once captured from a live
// session — see file header.
const FIND_A_HEARING_PATH = '/en/self-help/case-categories/find-a-hearing.html';

// TODO(verify): placeholder query shape. Replace with the real parameter
// names once captured (courtLevel/district/date are guesses based on the
// public description of the form fields, not a captured request).
function buildSearchUrl({ courtLevel, district, date }) {
  const url = new URL(FIND_A_HEARING_PATH, BASE_URL);
  url.searchParams.set('courtLevel', courtLevel || 'district');
  if (district) url.searchParams.set('district', district);
  if (date) url.searchParams.set('date', date);
  return url.toString();
}

function extractDate(text) {
  const m = text.match(/\b([A-Z][a-z]{2}\s+\d{1,2},\s+\d{4})\b/);
  return m ? m[1] : null;
}

// TODO(verify): the table/row selectors are placeholders — real markup
// needs to be captured first (see file header) before this can be trusted.
function parseResults(html, { caseRef, name }) {
  const $ = cheerio.load(html);
  const rows = $('table.hearing-results tr, table.calendar-results tr, table tr').toArray();
  for (const row of rows) {
    const text = $(row).text().trim();
    if (!text) continue;
    if ((caseRef && text.includes(caseRef)) || (name && text.includes(name))) {
      const date = extractDate(text);
      if (date) return date;
    }
  }
  return null;
}

/**
 * @param {{ ward: import('../../rules.js').Ward }} args
 * @returns {Promise<{found:boolean,date?:string,raw:string}>}
 */
export async function utahCheckHearing({ ward }) {
  if (!ward.caseRef) return { found: false, raw: 'no case reference on file yet' };
  const url = buildSearchUrl({ courtLevel: 'district' });
  const res = await fetch(url, {
    headers: { 'User-Agent': 'WardwellCoordinateCourtWatch/0.1 (pilot; contact diogo@medicaidsoft.com)' },
  });
  if (!res.ok) {
    throw new Error(`Utah courts calendar request failed: HTTP ${res.status} from ${url}`);
  }
  const html = await res.text();
  const date = parseResults(html, { caseRef: ward.caseRef, name: ward.name });
  return date
    ? { found: true, date, raw: `matched case ${ward.caseRef} at ${url}` }
    : { found: false, raw: `checked ${url}, no match for case ${ward.caseRef}` };
}
