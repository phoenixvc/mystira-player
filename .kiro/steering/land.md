---
inclusion: manual
---

# Landing a PR

Type `#land` in chat to apply this. Adapted from the Mystira `/land` command. It encodes failures that have actually happened here. Resolve what blocks the merge, report the rest. Do not merge unless the user asks.

1. **Base is `dev`.** If it is not, retarget it and say so. If the base is another PR's branch, this is a stacked PR: retarget before the parent merges (see global `workflow.md`).
2. **Read the bot comments, not the ticks.** A green tick is not a review: a bot skipped for quota, draft status or an error can still show green. Classify each reviewer as reviewed-and-clear, reviewed-with-findings, or did-not-review, and report `N of M reviewers actually evaluated`. A bot that skipped while the PR was a draft does not re-run when it is marked ready; re-request it.
3. **Name the check that proves the change.** Do not accept an aggregate "CI passed". Say which job compiles or tests the code that changed, and confirm it ran. If the repo has no workflows (check `.github/`), the proof is the local run: `pnpm exec tsc --noEmit` and `pnpm exec vitest run`, and say that CI did not cover it.
4. **Read the whole diff**, not the summary: debug output, commented-out code, secrets, generated artefacts, added TODOs, tests that assert nothing. Compare it against the PR description; anything shipped that the description omits is scope creep or a description to fix.
5. **Fix, push, re-read.** The last CI result describes the previous commit. Never force-push, never `--no-verify`.
6. **Never claim a merge you did not observe.** Re-query the PR state and cite it, and check the files are on `dev`.

Finish with: what merged or why not, which reviewers actually evaluated, which check proved the change, and what was deferred.
