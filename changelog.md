# Changelog — Cross-Context

> History of changes that affect the OS as a whole (installations, structural refactoring, new contexts).

---

## 2026-07-02 — Added Ligar Loop skill

- New skill installed in `.meuos/skills/`: `ligar-loop.md` (v1.0)
- Single entry point for agent loop engineering: designs a Loop Plan (pattern, 4 pillars, verifiable done criterion) for user approval, then turns the loop on with guardrails (green baseline, isolated environment, automated verification, iteration cap, rollback path)
- Merges and replaces the retired `engenharia-de-loop` and `loop-autonomo` skills (never installed in this OS)

## 2026-06-09 — Initial OS installation

- Structure created via `instalador-os.md` (Penna/Lúcio architecture)
- 2 contexts: job-search, personal-finances
- 4 required skills installed in `.meuos/skills/`: conferir-entrega, fim-do-dia, otimizar-os, otimizar-custo
- Auxiliary folders: `.meuos/agents/` (empty, for future custom agents)
