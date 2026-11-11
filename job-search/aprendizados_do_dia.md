# job-search — Daily Learnings

> Captures knowledge generated while working in this context.
> Format: Insight + Solution + Don't do.
> The agent reads this at the start of each session.

---

## Job leads from web search were expired (2026-10-12)

**Insight:** Web search returns old/cached job postings. The cloud session's network blocks job sites, so Claude could not open the pages to confirm they were live. Di found almost all 7 leads expired.

**Solution:** Only list a job after opening the live page and confirming it's open (needs job-site domains allowed in the environment's network settings), or have Di search with a "past week" date filter.

**Don't do:** Don't hand Di job leads that weren't verified as open — even with a warning.
