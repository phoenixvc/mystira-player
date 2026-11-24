---
inclusion: always
---

# Workflow (mystira-player)

General rules (baton protocol, honesty about context, PR base and stacked PRs, no inline tests, live-only fixes, handover format) live in the global `~/.kiro/steering/workflow.md`. This file holds only what is specific to this repo.

## Content validation

`scripts/check-content.py` (run by the validate-content hook and CI) needs `pyyaml` and `jsonschema` installed in the Python that Kiro's terminal uses.

## Git

- PRs target `dev`. Commit scopes for this repo: `engine`, `ui`, `content`, `schema`, `scripts`, `kiro`, `docs`, `deps`, `ci`.
- Handover traces go in `.agents/traces/trace-YYYY-MM-DD-<slug>.md`.
