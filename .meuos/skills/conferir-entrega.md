---
name: Conferir Entrega
description: |
  Verificacao rapida antes de declarar qualquer tarefa concluida. O agente ativa automaticamente ao perceber que algo foi concluido. Tambem pode ser chamada manualmente: "conferir entrega", "verificar entrega", "pronto", "terminei", "conclui", "feito", "pode fechar", "entregue", "finalizado", "check delivery", "done", "finished".
  Garante que nada foi esquecido, o OS esta atualizado e dados sensiveis estao protegidos.
version: 1.0
context: meuos
user-invocable: true
argument-hint: "[tipo da entrega] (opcional)"
---

# Check Delivery

## What this skill does

This skill is a quick verification that runs when you finish any delivery — a decision, a workflow, a document, a project. It makes sure nothing was forgotten: the OS is updated, files are organized, and no sensitive information was exposed. Takes less than 2 minutes.

## Golden rule

Only declare "done" when you have EVIDENCE that it's done. "I think it turned out well" is not evidence. "I verified X and the result was Y" is evidence.

## When to use

- When finishing any delivery (document, decision, automation, project)
- When the agent proactively suggests it upon noticing something was completed
- When you want to make sure nothing was left behind

## Checklists by delivery type

### Decision made or documented
- [ ] Is the decision recorded in documento_mestre.md? (Date + Decision + Reason)
- [ ] Were related pending items updated? (marked [x] or new ones added)
- [ ] If it involves a partner: were they aligned?

### Workflow or automation created
- [ ] Is it working? (tested with real data, not just imagined)
- [ ] If it errors, what happens? (is there handling or an alert?)
- [ ] Is the name and description clear enough to understand 30 days from now?
- [ ] Are credentials secure? (not hardcoded in plain text)

### Document or file created
- [ ] Does it follow the OS naming convention? (context in name, correct extension)
- [ ] Was index.md updated with the new file?
- [ ] If extracted from documento_mestre: does it have a pointer back?
- [ ] Does the index.md description reflect the actual content?

### Project or phase completed
- [ ] Was documento_mestre.md updated? (status, pending items, decisions)
- [ ] Are completed items marked [x] or migrated to changelog?
- [ ] Were learnings captured? (what worked, what not to do)

### Security (apply to EVERY delivery)
- [ ] No passwords, tokens, or keys exposed in plain text?
- [ ] No personal data (SSN, private email) hardcoded in files?
- [ ] Service credentials stored securely (environment variables, vault)?
- [ ] If you shared a file: removed sensitive info first?

## How to present completion

When done, use this format:

```
Completed: [what was done in 1 line]

Verifications:
- [x] [verified item] — [brief evidence]
- [x] [verified item] — [brief evidence]
- [ ] [non-applicable item] — skipped because [reason]

Suggested next step: [if any]
```

## When NOT to use

- Answers to questions (not a delivery)
- Research and queries (not an implementation)
- When the user says "no need to verify"

## Security rules

- Never skip the security check — it applies to EVERY delivery, no exception
- Never declare done without evidence — show what was verified
- Never invent verifications — if you didn't verify it, don't mark [x]
- Adapt to delivery type — don't apply automation checks to a simple decision
