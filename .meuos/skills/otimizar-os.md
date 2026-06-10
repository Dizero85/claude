---
name: Otimizar OS
description: |
  Organizes and compacts the files of the active context when they are growing too large. Executes when the user says "otimizar os", "organizar arquivos", "arquivos grandes", "compactar docs", "higienizar", "limpar documentos", "doc-compactor", "reduzir arquivos", "arquivos crescendo", "limpar terreno", "organizar contexto", "optimize OS", "organize files", "clean house", "clean up", "compact files".
  Analyzes, proposes a plan and executes only with user approval.
version: 3.3
context: meuos
user-invocable: true
---

# Optimize OS — Document Organization and Compaction

## What this skill does

This skill analyzes all documentation files in your OS (root + all folders + all subfolders), identifies which are growing too large and proposes an organization plan. It can summarize old sections, move completed content to history, and suggest creating secondary files when the main document is overloaded. Everything with your approval before any change.

## When to use

- When the agent alerts that files have 🔴 traffic light in End of Day
- Before a long session in a context (to "clean house")
- When files feel heavy and hard to navigate
- Once a month as preventive hygiene

## Step by step (instructions for the AI agent)

### STEP 0 — Backup Claude Code Memory (always first)

Before any scan/edit, copy Claude Code memory to a versioned folder inside the user's OS.

Origin: `~/.claude/projects/{working-dir-encoded}/memory/`
Destination: `auto-memory-backup/{YYYY-MM-DD}/`

```bash
DATA=$(date +%Y-%m-%d)
WORKING_DIR_ENCODED=$(pwd | sed 's|:||;s|/|-|g;s|\\|-|g')
ORIGEM=~/.claude/projects/${WORKING_DIR_ENCODED}/memory
DESTINO="auto-memory-backup/${DATA}"

if [ -d "$ORIGEM" ]; then
  mkdir -p "$DESTINO"
  cp -r "$ORIGEM"/* "$DESTINO/" 2>/dev/null
  echo "OK — memory copied to $DESTINO"
else
  echo "No Claude Code memory for this directory (skipping)"
fi
```

Auto-rotation — keep the 10 most recent backups.

### STEP 0.5 — Identify context to optimize (required scope)

This skill ALWAYS runs on ONE context at a time. Before any scan or edit, identify exactly which folder will be optimized:
- If the user informed it in the call: use that one
- If in doubt or not informed: ASK.
- NEVER scan the entire OS at once.

### STEP 1 — Scan and health report (ONLY THE CHOSEN CONTEXT)

For each file in the context:
- List all .md files
- Collect: name, number of lines, size in KB
- Identify the documento_mestre.md of the context

Present a table with health traffic light.

Traffic light rules:
| File | 🟢 OK | 🟡 Attention | 🔴 Needs action |
|------|-------|-------------|----------------|
| documento_mestre.md | < 300 lines | 300–500 | > 500 |
| claude.md | < 200 lines | 200–300 | > 300 |
| Secondary files | < 25KB | 25–40KB | > 40KB |
| changelog.md | < 30KB | 30–50KB | > 50KB |
| aprendizados_do_dia.md | < 200 lines | 200–250 | > 250 |
| index.md | < 100 lines | 100–150 | > 150 |

### STEP 2 — Deep analysis

For each file with 🔴 or 🟡 status, identify:

**2a. Separate permanent from temporary**

| Type | Examples | What happens |
|------|----------|-------------|
| Permanent | Business rules, standards, conventions, "never do X" | Stays where it is |
| Promotable | Rule used every session that should be in master doc | Moves up to documento_mestre.md |
| Temporary | Completed deliveries, fixed bugs, one-time decisions | Compacted by age |
| Outdated | Status that no longer applies, superseded decision | Goes to history or changelog |

Age criteria for temporary content:
| Age | What to do |
|-----|-----------|
| Less than 30 days | Don't touch |
| 30–60 days | Propose condensation |
| 60–90 days | Mandatory condensation + move details |
| More than 90 days | Keep only 1 summary line |

**2b. Dense sections that can become separate files**

When documento_mestre.md has a section with more than 50 lines about a single theme, it's a candidate to become a separate file in `satelites/`.

**2c. Obsolete content** — identify and propose archiving.

**2d. Rules that deserve promotion to master document** — present and ask for approval.

### STEP 3 — Action plan (always show before executing)

Present numbered list grouped by type. Ask:
"Can I execute the full plan? Or would you prefer to approve item by item?"

NEVER execute without user response.

### STEP 4 — Execution (only with approval)

**4a. Summarize old content**
- Read the original before altering
- Rewrite in compact format
- Verify no references were broken

**4b. Create separate file (split)**
- Create new file in `satelites/` with descriptive name
- Add at top: `> Parent document: documento_mestre.md`
- Move the content
- In master, replace with pointer: `> **[THEME]:** [summary]. Full document: satelites/name.md`
- Update context index.md
- Limit: maximum 3 new files per execution.

**4c. Archive obsolete content**
- Create `historico/` folder if it doesn't exist
- Move file there

**4d. Orphan .md hunt (ALWAYS execute)**
- List ALL .md files in the context
- For each file, verify if there's a reference to it in: context index.md, context documento_mestre.md, context claude.md
- For files with no reference (orphans), present table to user with suggestion (add pointer / archive / ignore). Wait for approval.

**4e. Confirm each change** — before/after for everything altered.

### STEP 5 — Final report

Present result with full paths, new files created, archived, and current status.

## Security rules

- Never execute without approval
- Never delete content — only move it
- Never summarize fundamental business rules regardless of age
- Never create more than 3 new files per execution
- Never break links between files
- Always read the file before altering it
- Always show before/after for changes to existing files
