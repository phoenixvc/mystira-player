---
inclusion: always
---

# Testing

Always loaded, so the approval rule applies before the first test of a file exists (a conditional match on test files would miss exactly that case). Adapted from Retort's `test-generator` and `coverage-guard` agents; the stack is the one in `tech.md` (Vitest, React Testing Library, MSW, Playwright).

## Plan first

Before writing any test, show a plan and wait for a yes:

```
Target: <file>  |  Framework: <Vitest | Playwright>  |  New file: <test path>
Proposed tests: <list, highest priority first>
Proceed? (yes / adjust / skip)
```

Do not write test files until the plan is approved. This is the "tests are a separate step" rule from `workflow.md`.

## Where untested code is

Start with files changed in the current session: a `src/**/*.ts` or `*.tsx` file with no matching `*.test.ts(x)` or `*.spec.ts(x)`.

## Conventions

- Arrange / Act / Assert, one behaviour per test.
- `RemoteEngine` contract tests use MSW, not hand-rolled fetch mocks.
- Element and interaction coverage runs through the Playwright harness with axe on every node and interaction type.
- Engine changes must keep the answer-leak tests green: `LocalEngine` strips every answer before building a node.

## Coverage

Advisory, never a mechanical gate. If asked for a coverage check and no target is known, ask once ("Coverage target for this session? e.g. 80%, or skip") and remember the answer for the session.

Report per-file coverage against the target and suggest tests for the gaps. Escalate to the user, rather than just advising, when several critical-path files are at 0% before a PR, or when code that handles child data or age gating is below target. Never leave a gap unreported.
