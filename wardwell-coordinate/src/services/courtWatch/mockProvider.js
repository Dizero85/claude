// Deterministic fake provider: no network calls, safe to run anywhere. This
// is the default (COURT_WATCH_PROVIDER=mock in .env.example) so the whole
// pilot — including the scheduler actually running — demos end to end with
// zero external dependencies. It simulates a docket match appearing after a
// couple of scheduled checks, driven by the real scheduler loop instead of
// firing instantly on stage entry the way the original demo did.
import { defaultHearingDateProvider } from '../../rules.js';

export async function mockCheckHearing({ ward, checkCount }) {
  if (checkCount >= 2) {
    return { found: true, date: defaultHearingDateProvider(), raw: 'mock provider: simulated docket match' };
  }
  return { found: false, raw: `mock provider: no match yet (check ${checkCount + 1} of 2)` };
}
