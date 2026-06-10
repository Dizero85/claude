---
name: Revisao Diaria
description: |
  Daily work session closing routine. Executes when the user says "revisao diaria", "fechar o dia", "encerrar", "fim do dia", "vamos fechar", "pode fechar", "encerra ai", "wrap-up", "encerrar sessao", "end of day", "close the day", "wrap up", "let's close".
  Guides 3 quick questions, saves learnings, migrates completed tasks and updates pending items in the active context master document.
version: 3.2
context: meuos
user-invocable: true
---

# End of Day — Daily Session Closing

## What this skill does

This skill guides you through a quick end-of-workday routine — less than 10 minutes. It asks three simple questions about what happened today, saves learnings in the right place, moves completed tasks to history, and leaves your pending items updated for the next day. At the end, it warns if any file is growing too large and needs organization.

## When to use

- At the end of any productive work session
- When you want to record an important decision before forgetting it
- When you want to leave a context organized before a long break
- When the agent proactively suggests it after a long session

## Step by step (instructions for the AI agent)

### STEP 0 — Identify context and map structure

Before any action, identify which context is being closed:
- If the user informed it: use that one
- If it was obvious from the conversation: use that one
- If in doubt: ask "Which context are we closing today?"

### STEP 1 — Synthesize and Confirm (inform before saving)

Principle: the agent does the synthesis work, the user only validates or adjusts. Never ask open questions — present a synthesis of the session and ask for confirmation/adjustment.

Synthesize the session by reading the current conversation history + recent aprendizados_do_dia.md of the context. Structure in 3 blocks (any can be empty):

```
Session summary for today in context [CONTEXT]:

📌 WHAT WE DID:
- [item 1 — delivery/decision/fix]
- [item 2]
(or "Discussion/analysis session — no concrete deliveries")

💡 WHAT WE LEARNED:
- [learning 1 — Insight/Solution/Don't do format]
- [learning 2]
(or "No relevant new learnings this session")

🔜 WHAT'S LEFT FOR TOMORROW:
- [new or ongoing open pending item]
(or "No new pending items — old ones remain open in MASTER")
```

Present to user and ask: "Does this summary look right? You can confirm, adjust, add or remove any item."

Apply the decision:
- If there's confirmed "what we did" → goes to changelog (STEP 3)
- If there's confirmed "what we learned" → goes to aprendizados_do_dia.md (Insight/Solution/Don't do format)
- If there's confirmed "left for tomorrow" → updates pending items in documento_mestre.md (STEP 4)
- If user said "skip" or "nothing to record" → don't save anything, go to STEP 5

**CRITICAL RULE — don't force content:**
- Session may have been reading/analysis only with no deliveries → "WHAT WE DID" can just list the discussion without going to changelog
- Session may have zero new learnings → "WHAT WE LEARNED" stays empty and nothing goes to aprendizados
- Session may generate no new pending items → "LEFT FOR TOMORROW" only lists old ones
- NEVER invent learnings or pending items to "fill" the 3 blocks. If it's empty, it's empty.

### STEP 2 — Save learnings

Write to the aprendizados_do_dia.md file of the active context.

Format for each entry:
```
## [Short descriptive title] (DD/MM)

**Insight:** [What was learned — 1 to 2 direct sentences]

**Solution:** [How it was resolved or what decision was made — 1 to 2 sentences]

**Don't do:** [Rule that prevents repeating the problem — 1 clear sentence]
```

Order (most important first): Business Rules → Strategic → Technical

### STEP 3 — Migrate completed tasks

Read documento_mestre.md of the active context. Identify all items marked as done ([x]).

For each completed item, add to changelog.md:
```
### [DATE] — [Short title]

- [Completed item 1]
- [Completed item 2]
- [Decision made, if any]
```

In the master, replace the [x] item with a reference line:
- ~~[x] [Task description]~~ → see changelog [DATE]

**IMPORTANT:** Never delete content from the master document without showing the user what will be moved and asking for confirmation.

### STEP 4 — Update pending items

Update the pending items list in the active context master:
- Add new pending items informed by the user (format `[ ] [description]`)
- Keep old pending items that are still open
- Update the "Last updated" date in the document header

### STEP 5 — Check file health

Check file sizes of the active context and present a quick report.

| File | Status |
|------|--------|
| documento_mestre.md | 🟢 OK / 🟡 Attention / 🔴 Large |
| aprendizados_do_dia.md | 🟢 OK / 🟡 Attention / 🔴 Large |
| changelog.md | 🟢 OK / 🟡 Attention / 🔴 Large |

Traffic light rules:
| File | 🟢 OK | 🟡 Attention | 🔴 Large |
|------|-------|-------------|---------|
| documento_mestre.md | < 300 lines | 300–500 | > 500 |
| aprendizados_do_dia.md | < 200 lines | 200–250 | > 250 |
| changelog.md | < 30KB | 30–50KB | > 50KB |

If any file is 🔴, suggest: "I identified files growing too large. I recommend running the Optimize OS skill. Want to do that now?"

### STEP 6 — Update index.md

If index.md exists in the active context folder:
- List all .md files in that folder
- Compare with current index.md
- Add new files (satellites created during the day)
- Update date in header

### STEP 7 — Final summary

```
End of Day complete ✓

Context closed: [context path]
Learnings saved: [X new entries in aprendizados_do_dia.md]
Tasks migrated: [X items moved to changelog]
Pending items updated: [X new + X old kept]
File health: [all ok / X files need attention]
Index.md: [updated / created / didn't exist]
```

## Security rules

- Never delete content — only move to changelog with reference
- Never migrate completed items without user confirmation
- Never invent learnings — only record what the user confirmed
- Never access files from another context without explicit permission
- Never declare complete without having updated at least aprendizados_do_dia.md and the master document
