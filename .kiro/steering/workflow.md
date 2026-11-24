---
inclusion: always
---

# Workflow (mystira-player)

General rules (baton protocol, honesty about context, PR base and stacked PRs, no inline tests, live-only fixes, handover format) live in the global `~/.kiro/steering/workflow.md`. This file holds only what is specific to this repo.

## Content validation

`scripts/check-content.py` (run by the validate-content hook and CI) needs `pyyaml` and `jsonschema` installed in the Python that Kiro's terminal uses.

## Protected files

Change these only when the user asked for it, and say what depends on them first:

- `schema/story-schema-2.1.json`: the content contract. Classify a change as additive or breaking, and list the content files it affects.
- `package.json`, `tsconfig*.json`, `vite.config.*`: they affect every build and test run.
- `.kiro/hooks/**` and `.kiro/steering/**`: these govern the agents themselves. Draft a change and show it; do not quietly loosen a rule.
- `README.md`, `AGENTS.md`, `CLAUDE.md`: shared by people and several tools.

## Steering budget

Files with `inclusion: always` are paid for on every request. New rules default to `fileMatch`, `auto` or `manual`, and only go in an always file when they must apply with no file open.

## Kiro write-up

A PR that adds or changes steering, hooks, specs or MCP config also updates `docs/kiro-writeup.md` in the same PR. Record only what happened.

## Git

- PRs target `dev`. Commit scopes for this repo: `engine`, `ui`, `content`, `schema`, `scripts`, `kiro`, `docs`, `deps`, `ci`.
- Handover traces go in `.agents/traces/trace-YYYY-MM-DD-<slug>.md`.
