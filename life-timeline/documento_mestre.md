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

Part 7 (same day): **First photos arrived** — 5 NYC photos (Times Square, 9/11 Memorial, 2 skyline views from an observation deck; one was an exact duplicate of the Times Square shot, skipped). Di asked for "something fun, creative... a collage." Built:
- Uploaded 4 distinct photos as artifact assets (`/_blob/<id>` urls, see the deck's own files for the ids)
- Added a new slide, `new-york-photos`, right after the existing New York text slide — a polaroid-style scrapbook collage (white-bordered, drop-shadowed, slightly rotated photo cards), no bullet text, just the photos plus a light caption "New York City — 2007 to 2012" and "A few frames from those years."
- Deck is now 10 slides

Part 8 (same day): Di sent **14 Denver photos** — 12 outdoors/city (mountains, hikes, snow, Red Rocks, the Big Blue Bear, aerial Boulder) and 2 from the hospital where he worked. Applied:
- `denver-life`: replaced the 3 generic icon cards with an actual 4x3 photo grid (all 12 outdoor/city photos) — real photos beat icons, so the icons are gone from this slide now
- `denver` (career slide): added the 2 hospital photos as a small pinned polaroid-style pair in the top-right corner; narrowed the heading's width slightly so it doesn't collide with them

Still no photos for: Ipatinga (swimming), Belo Horizonte, Brazil, cover. Part 9 (same day): Di sent 4 Brazil vacation photos (2 crowded beach, 1 empty beach, 1 colonial-town plaza — likely Ouro Preto or similar) and asked for a new **hobbies** slide — his first hobby: beach trips/travel. This is a different kind of content than the chronological chapters (not tied to a life stage), so it got its own slide, placed after `brazil` and before `closing`, no chapter number (same treatment as `denver-life`/`new-york-photos`). Built with the polaroid-scatter pattern.

Part 10 (same day): Second hobby — Di sent 10 concert photos (club shows, arena/stadium shows, a couple of named-artist shots like Marina) and said his hobby is live music/concerts, especially big stadium shows. As predicted, the hobbies content grew past one slide — added `hobbies-concerts` right after `hobbies`, using the photo-grid pattern (5x2) since 10 photos is too many for the polaroid-scatter style. Deck is now 12 slides. If more hobbies come up, keep splitting into one slide per hobby rather than cramming into `hobbies`.

Part 11 (same day): First photo for the **Ipatinga** slide — Di sent one image, already a pre-made collage of 6 childhood swim-team photos (team group shots, poolside, a young kid at the beach). Redesigned the Ipatinga slide's right column: the photo now takes the prominent spot (large, rounded, shadowed) with the three stats ("15 years," "Top 10 in Brazil," "Dozens of medals") condensed into small pill badges below it, replacing the old all-text dark stat card. This is the first chapter slide with a real photo — same "photo beats icons/stats" principle as the Denver redesign.

Part 12 (same day) — **visual refresh + New York merge.** Di reviewed the deck and gave two pieces of feedback:
1. The New York slide felt empty/text-only sitting apart from its photo slide — merge them into one slide with text AND photos, don't leave a bare slide.
2. New content: **5 years in New York** (this resolves the earlier 7-vs-dates discrepancy in Di's favor — confirmed 5, matching the 2007→2012 math). Also a 4th job: **personal assistant** (alongside restaurants, dog walking, English classes).
3. Overall visual note: he doesn't want the deck's card/box look — "don't want it to be like those boxes... looked like the last presentation I did." He explicitly said the **photo montages are great, keep those** — the complaint is about the white/dark rounded-rectangle stat cards used for text content.

Applied:
- Merged `new-york` + `new-york-photos` into a single `new-york` slide: short narrative paragraph (English, restaurants, dog walking, personal assistant, 5 years) + the same 4-photo polaroid collage, scaled to fit alongside the text. Deleted `new-york-photos` from the deck (order, sections, and the file itself).
- **De-boxed the stat/content cards deck-wide**: removed white/dark fill + shadow + border-radius from `journey`, `belo-horizonte`, `denver` (stat cards only — the 2 pinned hospital photos kept their polaroid-photo treatment), `brazil`, and `ipatinga`'s stat pills. New pattern: a thin `border-top:3px solid #DD9A3D` + generous top padding, text directly on the slide's own background — editorial/rule-based instead of "dashboard card." Icons, photos (polaroid scatter + grid), and typography untouched — those were explicitly praised.
- This is now the deck's established visual language for any future content slides: **no filled/shadowed boxes for text; top-rule accents only. Photos keep their polaroid or grid treatment.**

Part 13 (same day): Di gave much richer detail on the Denver career itself — this was previously flattened to "certified in patient navigation." Now:
- **First 2 years: Community Health Worker (CHW)** — Medicaid intake, Medicare Savings, and other public programs to get people into the hospital; focus on Denver's immigrant community
- **After 2 years, transferred to Patient Navigator** (the remaining ~11 of the 13 years) — colorectal cancer screening specifically, building a career in gastroenterological health, helping patients get colonoscopies as prevention
- Traveled around the US for this work
- Won an **American Cancer Society award** for the colorectal cancer work in Denver

This didn't fit as an addition to the existing single Denver slide without overloading it, so split into two:
- `denver` (Chapter 4, unchanged position, dark): now a two-era career arc — CHW first, Patient Navigator after — replacing the old single "patient navigation" framing. Kept the "13 years, started December 2012" stat as a supporting line under the heading. Hospital photos stayed put.
- `denver-achievements` (new, light, no chapter number, placed right after `denver` and before `denver-life`): TV interviews & the Denver Walk, national travel, the ACS award — the recognition/impact slide, kept separate from the role description.

Part 14 (same day): Di reviewed and said the New York photos looked "busy" and one appeared "upside down" at the smaller merged-slide size. Replaced the tilted/overlapping polaroid-scatter treatment on `new-york` with a plain, straight 4-across grid (no rotation, no overlap) — same pattern as `denver-life`/`hobbies-concerts`. This removes the only remaining polaroid-scatter treatment that was fighting for space with real text on the same slide; the two dedicated photo slides (`hobbies`, and the achievements/collage-style ones) keep their scatter/rotation since those have the full slide to themselves and Di hasn't flagged an issue there.

Part 15 (same day): Di sent 4 more photos — a basketball arena crowd shot, an aerial Colorado city view, a snowy mountain valley, and himself on **Univision Colorado (Noticias)** in a Denver Health jacket, giving a TV interview. Applied:
- `denver-achievements`: added the Univision photo as a pinned corner accent next to the "TV interviews & the Denver Walk" item — direct visual proof, same treatment as the hospital photos on the `denver` slide
- `denver-life`: added the 2 Colorado scenery photos to the existing grid, now 14 photos, reconfigured from 4x3 to 7x2 to fit
- New third hobby slide, `hobbies-sports` (after `hobbies-concerts`, before `closing`): a single large hero photo of the arena crowd, no rotation (kept it calm per the "busy" feedback from part 14) — Di's third named hobby is watching live sports/going to games

Deck is now 14 slides. Still no photos for Belo Horizonte, Brazil, or the cover.

Two patterns now established for reuse:
- **Photo grid** (denver-life): `display:grid` of `<img object-fit:cover>` tiles, good for many photos of one theme
- **Polaroid scatter** (new-york-photos, and the small corner pair on denver): white-padded cards, box-shadow, slight `rotate()`, `position:absolute` — good for a handful of photos as a creative accent

Upload workflow: Artifact `publish` with `asset:true` and `file_paths` (or `file_path` for one), then reference the returned url verbatim in `<img src="...">`.

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
