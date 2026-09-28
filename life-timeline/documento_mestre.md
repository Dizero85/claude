# life-timeline — Master Document

> Living document: scope, status, pending items, decisions.
> Update throughout sessions. The agent reads this BEFORE working.
> Last updated: 2026-09-01

---

## Scope

Create a timeline-style presentation telling the story of Di's life — a storyline of who he is, key milestones, and where he's been — to be built up gradually as he gathers photos and material.

## Objective

1. Turn Di's life milestones into a clear, visual timeline/storyline
2. Make it easy for Di to keep adding to it as he finds more photos and remembers more details
3. End up with something he's proud to show others (family, friends, maybe even professionally)

## Current Status

**First draft deck built.** Di gave enough material for chapters 1-4 (Ipatinga/swimming, Belo Horizonte, New York, Denver) and said "let's start here" — read as the green light to build, not to keep waiting. Built a 7-slide deck using the Artifact "Slides" type (16:9, presents live, downloads as PDF/PPTX from its Share menu):

**Deck:** https://claude.ai/artifact/WQoCraSQzZ2A8dCvVAH5qL — "My Story — From Ipatinga to Denver"
Slides: cover → the journey (4-city overview) → Ipatinga (swimming career) → Belo Horizonte (college) → New York (English/restaurants/dog walking) → Denver (patient navigation career) → closing ("to be continued")

Both placeholders resolved and applied to the deck (2026-09-28 part 2): university is **UniBH**, hospital tenure is **13 years**.

The "Belo Horizonte High School" wording was resolved (2026-09-28 part 3): confirmed as just an imprecise recap — high school was in Ipatinga, college (UniBH) in Belo Horizonte, matching what the deck already said. No deck change needed.

Resolved (part 4): Di gave precise dates — NY end of 2007, Denver 2012, Denver Health start **December 2012**. Treating this as accurate over the earlier "7 years" claim (dates > round numbers). NY duration works out to ~4-5 years. Deck doesn't state an NY duration, so no slide change was needed. This also lines up December 2012 + 13 years ≈ end of 2025 at Denver Health, consistent with Activate Care coming after and ending recently (per root claude.md).

**Story complete, deck now 9 slides — waiting on photos.** Di gave stage 5 on 2026-09-28 (part 5): after 14-15 years in Colorado, moved back to Brazil to be close to his mother, family, and longtime friends. Added a "Chapter 5 — Back to Brazil" slide (family-focused framing, not the job-loss angle from root claude.md — deliberate choice for a team-facing "get to know me" deck; flagged in the slide's speaker notes as a separate, more private conversation if anyone asks). Rewrote the closing slide from "to be continued" to a "full circle" wrap-up.

Part 6 (same day): Di added detail to the Denver chapter — he was part of the **Denver Walk for Colorectal Cancer**, did **TV interviews**, and outside work did a lot of **hiking, camping, and fun**. Applied:
- Updated the existing Denver slide's third card to name the Denver Walk specifically (was generic "TV spokesperson")
- Added a new slide, `denver-life`, between Denver and Brazil — "life outside work" (hiking, camping, good times), no chapter number (a side-note to Chapter 4, not a new chapter)

Di then said he's going to go get photos and "put them in between these lines" — expect a pause here. When he returns with images: read `project/deck.json` fresh, and for each photo, `<img src="/_blob/<id>">` after uploading the file as an asset via the Artifact tool (`asset:true`), following the deck's own image workflow in `artifact-type/reference/images.md` if more detail is needed. Good candidate slides for photos, roughly in order of how well they'd land: ipatinga (swimming), denver-life (hiking/camping), denver (TV interviews/Walk), new-york, belo-horizonte, brazil, cover.

Full raw material is in `satelites/raw-material.md`.

Scope confirmed on 2026-09-01 (first pass):

- **Format:** slideshow, delivered as a PDF export. Presented live to a team over Google Meet (screen share) — not a casual scrollable webpage.
- **Scope:** NOT his whole life — just his move/career story, in 4 stages:
  1. Where he's from (Brazil)
  2. When he moved to the US
  3. The type of work he did in the US
  4. Working at the hospital, and why he moved back to Brazil
- Photos still to come — building the deck structure and text first, photos get dropped in later.

## Known building blocks (from claude.md / soul.md — NOT yet confirmed as timeline entries)

These are facts already known about Di from the OS's root files. They are a starting point for a conversation, not finished milestones — confirm dates and framing with Di before using them:

- Patient navigator / community health worker, 12+ years in colon cancer prevention (Denver Health, then Activate Care)
- Lost his job when Activate Care ended its Colorado contract
- Home base: Wheat Ridge, CO, owned with his wife
- Currently in Brazil staying with friends and family
- At a crossroads: stay in Brazil, return to the US, or take a potential NYC opportunity

## Open Questions — ANSWERED 2026-09-01

- [x] Format → slideshow / PDF export, presented live over Google Meet
- [x] Scope → 4 stages: from Brazil → moved to US → work in the US → hospital work + move back to Brazil
- [x] Audience → a team, in a Google Meet presentation (professional context, not just personal/family)
- [x] Photos → not ready yet, come later; build structure/text first

## Answered 2026-09-01 (part 2) — see satelites/raw-material.md for exact wording

- [x] Tone/purpose → get-to-know-me intro deck for the team
- [x] Hometown → Ipatinga, Minas Gerais (mid-sized town) → moved to Belo Horizonte for school
- [x] University/degree → Communications, university name given as "Univega, University of Belo Horizonte" — **needs spelling confirmation, don't guess the real name**
- [x] Move to US → end of 2007, right after graduating
- [x] New York → lived there 7 years (~end 2007 – ~2014) — but what he *did* there is still unknown
- [x] Colorado → moved to Denver; worked at Denver Health for 12 years

Di said "let's stop there, I'll continue later" — pausing here is expected, not a gap to chase.

## Still missing (for when Di continues)

- [ ] What he actually did for work in New York (7 years — currently a blank in the story)
- [ ] Denver Health: role/title, what the colon cancer prevention work looked like
- [ ] Activate Care: role, dates, how it fits with the Denver Health 12 years (claude.md implies the 12+ years spans both employers — Di said 12 years at Denver Health specifically; don't resolve this myself, ask him)
- [ ] Stage 4: hospital name + role there
- [ ] Why he moved back to Brazil, framed for a team audience (claude.md says Activate Care ended its CO contract — confirm if that's the whole story)
- [ ] University name spelling ("Univega" / University of Belo Horizonte)
- [ ] Photos per stage, once he has them

## Rules of operation

- Never invent milestones, dates, or details — only use what Di confirms
- Keep the presentation private/unpublished unless Di explicitly says to share it
- Design so Di can hand over new photos/details in chat and have them added, without needing to edit files himself

## Open Pending Items

- [ ] Di brings photos and life details (his stated next step)
- [ ] Decide presentation format (see Open Questions)
- [ ] Draft a first version of the timeline structure once material arrives
- [ ] Build the actual visual presentation

## Important Decisions

*(format: **DD/MM/YYYY** — Decision — Reason)*

- **01/09/2026** — Registered as its own context (`life-timeline`) rather than folded into job-search or personal-finances — Reason: it's a distinct, personal project with its own scope and doesn't belong under either existing context.

## Next Steps

1. Wait for Di to bring photos and material (his own stated plan)
2. When he returns, ask the Open Questions above to lock down format and scope
3. Build a first draft timeline
