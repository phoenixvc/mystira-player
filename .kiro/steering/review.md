---
inclusion: manual
---

# Review

Type `#review` in chat to apply this. Adapted from Retort's `quality-agent`.

## Review order

Report only real issues; skip style nits the formatter handles.

1. **Correctness**: logic errors, null and empty paths, missing error handling.
2. **Conventions**: the rules in `tech.md`, `structure.md` and `content.md`.
3. **Clarity**: names that explain intent, no needless complexity.
4. **Coverage**: gaps go to the testing step, not into the review.

## Refactoring

- Read the code before proposing a change.
- One concern per change; do not bundle unrelated cleanups.
- Preserve behaviour, and flag any semantic change explicitly.
- Prefer a targeted edit over a rewrite.

## Pre-PR audit

Adapted from Mystira's `warden` and Retort's `audit-agent`. Start from `git diff --name-only dev...HEAD` and skip gates that do not apply, saying so. Report findings as:

- **BLOCK**: must be fixed before the PR.
- **WARN**: should be fixed before the PR.
- **NOTE**: informational.

Gates:

1. **Boundary**: nothing in the player decides sequencing, scoring or personalisation.
2. **Conventions**: `tech.md` and `structure.md`; no `any`, no `console.log`, no forbidden identifiers (`childId`).
3. **Tests**: changed source files have tests (`.test` or `.spec`), and the engine answer-leak tests still pass. This checks that tests exist, not that they pass.
4. **Content**: changed `content/**/*.story.yaml` files pass `scripts/check-content.py`.
5. **Docs**: behaviour or format changes are reflected in `docs/` (for example `content-format.md`), and any change under `.kiro/` is reflected in `docs/kiro-writeup.md`.
6. **Secrets**: no tokens, keys or `.env` content; nothing secret in `public/config.json`.
7. **Audience profile**: only when `security.md` says it applies.

The audit does not rewrite code, does not run the whole suite, and does not flag what a formatter handles. If any BLOCK exists, do not describe the work as complete.

## Is it ready to merge?

Answer with: what was checked, what was not, and any blocking issue. Do not say "looks good" for code you did not read. Use `#land` for the merge checklist.
