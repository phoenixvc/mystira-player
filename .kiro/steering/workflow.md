---
inclusion: always
---

# Workflow

## Tests

Do not write tests inline while implementing. Finish the implementation, then write the tests as a separate step. The exception is fixing a stale assertion in the same edit.

## Content validation

`scripts/check-content.py` (run by the validate-content hook and CI) needs `pyyaml` and `jsonschema` installed in the Python that Kiro's terminal uses.

## Baton (shared task graph)

When the baton MCP tools are available:
- Call `task_check` before creating work, so nothing is duplicated.
- Use `task_notify` for new work others should see.
- Call `log_agent_message` when taking over, handing off, finishing or blocking.

## Handover

At the end of a session, write a short handover to `.agents/traces/YYYY-MM-DD-handover-kiro-mystira-player.md`: what changed, what is unfinished, and the next command.

## Git

Conventional commits. Never push to `dev` or `main` directly; use a branch and a PR.
