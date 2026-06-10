---
name: otimizar-custo
description: |
  Reduces token cost of Claude Code sessions by cleaning up the agent's memory. You pay tokens for MEMORY.md in every conversation — each line is charged. A memory of 263 lines can become 95 (-64%) after cleanup. This skill turns that reduction into direct daily savings.
  Scans MEMORY.md and topic files, classifies entries as OK, old, duplicate, or things that should be in the OS, alerts if CLAUDE.md is also large (it also loads every session), and proposes a cleanup plan — always with approval before executing.
  Triggers when user says: "otimizar custo", "reduzir custo", "economizar tokens", "otimizar memoria", "limpar memoria", "higienizar memoria", "memoria do claude", "revisar memoria", "auditar memoria", "optimize cost", "reduce cost", "optimize memory", "clean memory".
context: meuos
user-invocable: true
argument-hint: "(no arguments — runs in the current Claude Code folder)"
---

# Optimize Cost — Reduce Session Token Cost

## What this skill does

Your AI agent (Claude Code) stores a "memory" of your preferences, context, and decisions — it lives in a special folder on your computer. Over time this memory grows and fills up with old, duplicate, or misplaced content that should be in your OS, not in the agent's memory. This increases cost per conversation (more tokens loaded) and makes the agent slower or confused.

This skill scans that memory, shows what can be cleaned, and executes the cleanup with your approval. Typical reduction: 60% to 80% of the size.

**Important:** This skill only applies if you use Claude Code. If you use Cursor, Claude CoWork, or another tool, its "memory" lives elsewhere — this skill doesn't apply.

## Why this reduces your cost

Every Claude Code conversation loads the content of the MEMORY.md file as initial context. If it has 300 lines, you pay tokens for those 300 lines in every message. Keeping it lean (under 100 lines), you save every day.

Real example: a MEMORY.md of 263 lines becomes ~95 lines after cleanup — a ~64% reduction in the fixed cost of each session.

## When to use

- When the End of Day skill alerts that memory is large
- Once a month as preventive hygiene
- When Claude Code feels slow or confused with old things
- When user says "optimize memory", "clean claude memory", "audit memory"

## Step by step (instructions for the AI agent)

### STEP 0 — Confirm working directory

Before scanning, show the user the current directory and ask for confirmation:
"I'm going to scan Claude Code memory for this directory: [path]. Confirm?"

The memory lives in `~/.claude/projects/{working-dir-encoded}/memory/`, where `{working-dir-encoded}` is the current directory path with `/` and `\` replaced by `-` and `:` removed.

If the `memory/` folder doesn't exist: warn the user that there is no memory to clean up for this directory. Stop.

### STEP 1 — Scan the memory

List MEMORY.md + all .md files in the memory/ folder.

For each file collect: name, number of lines, size in KB, last modification date.

Present table with traffic light:

```
Claude Code Memory — [path]

| File | Lines | Size | Modified | Status |
|------|-------|------|----------|--------|
| MEMORY.md | 263 | 26KB | today | 🔴 very large |
| feedback_email_pattern.md | 45 | 2KB | 02-MAR | 🟡 old |
| stack-config.md | 28 | 1KB | 15-APR | 🟢 ok |

Total: 8 files, 54KB, last optimization: never
```

Traffic light rules:
| Metric | 🟢 OK | 🟡 Attention | 🔴 Action |
|--------|-------|-------------|----------|
| MEMORY.md lines | < 100 | 100–150 | > 150 |
| Number of topic files | < 15 | 15–20 | > 20 |
| Age without modification | < 60 days | 60–90 days | > 90 days |
| Topic file size | < 5KB | 5–10KB | > 10KB |

**Extra check: CLAUDE.md also adds to cost**

Besides MEMORY.md, the root claude.md and the active context claude.md are also loaded in every message (project instructions). If they are large, they add tokens every session.

Check and alert (without acting — only point out):
| File | 🟢 OK | 🟡 Attention | 🔴 Consider slim |
|------|-------|-------------|-----------------|
| claude.md root | < 200 lines | 200–300 | > 300 |
| context claude.md | < 150 lines | 150–250 | > 250 |

If any is 🟡 or 🔴, suggest: "I detected that claude.md [root/context X] has N lines — also loads every session. Consider running 'Optimize OS' skill to slim it after this memory cleanup."

Only alert — don't touch CLAUDE.md here.

### STEP 2 — Classify each entry

For each file (and for lines in MEMORY.md that point to topics), classify in 3 categories:

| Category | Criteria | What to do |
|----------|----------|-----------|
| Keep | Active personal preference, style rule, agent convention — used in recent weeks | Leave as is |
| Archive | More than 90 days without modification, content about project/decision that has passed | Move to memory/historico/ |
| Promote | Information that should be in your OS (business rule, product decision, active stack) | Copy to OS and remove from here |

### STEP 3 — Action plan (always show before executing)

Present a NUMBERED list grouped by category. Ask:
"Can I execute the full plan, or would you prefer to approve item by item?"

NEVER execute without user response.

### STEP 4 — Execution (only with approval)

**4a. Archive old file**
- Create `memory/historico/` folder if it doesn't exist
- Move the file there
- Remove the corresponding line in MEMORY.md (if it pointed to it)

**4b. Promote to OS**
- Read the original topic file
- Identify the right destination in the OS (ask user if not obvious)
- Copy content to destination
- Add a note at destination: "Promoted from memory on DD/MM by user"
- Delete the original file from Claude Code memory
- Remove the corresponding line in MEMORY.md

**4c. Clean MEMORY.md lines**
- Read the entire MEMORY.md before altering
- Remove only the approved lines, keeping the index structure
- Update header: "> Last optimization: DD/MM (Optimize Cost skill)"
- Save

Before any change, show before/after for each file touched.

### STEP 4.5 — Check if there's actually something to optimize

Before proposing any plan, verify if the current state actually justifies cleanup:

| Signal | What to do |
|--------|-----------|
| MEMORY.md already under 100 lines + zero files >90d without mod + zero duplicates | Warn that there's nothing to clean and stop |
| Last run was less than 30 days ago AND metrics improved less than 10% | Warn that it's too soon |
| No PROMOTE, ARCHIVE, or duplicate items detected | Warn that memory is healthy |

RULE: never force a cleanup plan when there's no real gain. Excessive cleanup removes useful content.

### STEP 5 — Final report with estimated savings

Savings calculation (simple parameters):
- 1 MEMORY.md line = ~15 tokens on average
- Claude Sonnet cost (input): ~$3 / 1M tokens
- Claude Opus cost (input): ~$15 / 1M tokens
- Sessions per day × 30 days × tokens saved per message = monthly savings

Report format:
```
Cost optimization complete ✓

| Metric | Before | After | Reduction |
|--------|--------|-------|-----------|
| MEMORY.md | 263 lines | 94 lines | -64% |
| Topic files | 8 | 3 active + 2 archived | -38% |

💰 Estimated savings (input tokens charged every message):
- In Sonnet (50 msgs/day): ~$11/month
- In Opus (50 msgs/day): ~$57/month

Next cleanup recommended: 90 days from now
```

## Security rules

- Always confirm directory before scanning
- Never execute without explicit approval
- Never delete a file without archiving first
- Never promote to OS without identifying the exact destination
- If memory/ folder doesn't exist, don't create it — just inform
- Does not auto-trigger — user must explicitly request it
