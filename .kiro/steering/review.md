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

## Is it ready to merge?

Answer with: what was checked, what was not, and any blocking issue. Do not say "looks good" for code you did not read.
