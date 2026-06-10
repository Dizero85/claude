# guia_do_os.md — How Your Personal OS Works

> Generated on 2026-06-09 via instalador-os.md (Penna/Lúcio architecture)

## What this system is

Your personal OS is a set of Markdown (.md) files that organize your knowledge, decisions, and work contexts. They live on your disk (and can be synced via Google Drive) and work with any AI tool that reads .md files.

The system is simple: the more you use it, the smarter it gets — because it captures what you learn.

## Your files and what each one does

### In the OS root

| File | Purpose |
|------|---------|
| **claude.md** | Global rules — the agent reads automatically. Identity, rules, context map |
| **soul.md** | Agent personality — tone, posture and role in each context |
| **guia_do_os.md** | This file — explains how the system works |
| **index.md** | General catalog — lists all files and points to each context index |
| **aprendizados_do_dia.md** | General learnings (cross-context) |
| **changelog.md** | General session history |

### In each context (folder)

| File | Purpose |
|------|---------|
| **claude.md** | Context-specific rules — agent role, what not to do |
| **documento_mestre.md** | Living document: scope, status, pending items, next steps. Update always! |
| **aprendizados_do_dia.md** | Knowledge capture: Insight + Solution + Don't do |
| **changelog.md** | History of what was done and decided (never edit old entries) |
| **index.md** | Context catalog — lists all files in this folder |

## Your routine with the OS

1. **Start a work session**
   - The agent reads claude.md automatically
   - Tell it the context: "I'm working on [context]"

2. **Work normally with the AI**
   - The agent consults documento_mestre.md to understand the status
   - Decisions and pending items are updated during the session

3. **At the end, capture learnings**
   - Say: "end of day"
   - The agent synthesizes, you confirm/adjust, it saves
   - Format: Insight + Solution + Don't do

4. **The OS gets smarter every session**
   - Decisions are documented in changelog
   - Patterns and mistakes go into aprendizados
   - Next session, the agent already knows what was done and decided

## The 4 required skills

### End of Day
Command: **"end of day"** or **"let's close"**.
Synthesizes the session (what was done / learned / left for tomorrow), you confirm, and the agent updates mestre + aprendizados + changelog + index. Empty sessions are expected — it won't force you to record anything.

### Check Delivery
Command: **"check delivery"**, **"done"**, **"finished"**.
Verifies in under 2 minutes: master document updated? learnings captured? index updated? no sensitive data exposed?

### Optimize OS
Command: **"optimize OS"** or **"clean house"** (run once a month).
Runs on ONE context at a time, makes automatic backup of Claude's memory, analyzes file sizes with traffic light, separates permanent/temporary/obsolete, hunts orphan files, updates indexes. Only executes with your approval.

### Optimize Cost
Command: **"optimize cost"** or **"optimize memory"** (run once a month).
Cleans up Claude Code's MEMORY.md (charged on every message). Classifies as keep/archive/promote. Shows estimated savings in R$/month (typical: R$ 55–285). Warns if claude.md is also getting large. Stops if there is nothing to optimize (running too often degrades files).

## How to open your files

Open the OS folder in VSCode (File → Open Folder). With the Claude Code extension installed, the agent reads claude.md automatically.

## Moving to Google Drive

To sync this OS to your Google Drive (MeuOS folder):
1. Copy this entire folder to your Google Drive / MeuOS folder
2. Open that folder in VSCode (File → Open Folder)
3. From then on, always open from the Drive folder — changes are auto-synced
