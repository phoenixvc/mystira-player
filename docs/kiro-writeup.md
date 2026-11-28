# How we used Kiro

A running log, kept from the first day of the build. Each entry says what we did in Kiro and what it changed. Update it in the same PR as any change to `.kiro/` (see `workflow.md`), and only record what actually happened: an empty "what it caught" cell is better than a guessed one.

## Steering

Files in `.kiro/steering/`. Only the first group is paid for on every request; the rest load on demand, to keep the always-on context small.

| File | When it loads | What it holds |
|---|---|---|
| `product.md` | always | What the player is, the Manor entry, the four core interactions, the cut order. |
| `tech.md` | always | The stack, the rule that the engine decides and the player only renders, exact identifier names. |
| `structure.md` | always | Folder layout and conventions. |
| `content.md` | always | The story YAML 2.1 rules and the command that validates every content file. |
| `workflow.md` | always | Repo-specific git and validation notes; the general rules live in the user-level `~/.kiro/steering/workflow.md`. |
| `testing.md` | always | Plan-first testing, where untested code is, coverage as advisory. |
| `frontend.md` | UI files open | Accessibility, tokens, timeouts, the player/engine boundary. |
| `security.md` | auto, by topic | Secrets, telemetry and data minimisation; an opt-in profile for audiences that include minors. |
| `review.md` | `#review` | Review order and the BLOCK / WARN / NOTE pre-PR audit. |
| `land.md` | `#land` | The merge checklist: read bot comments, name the proving check, never claim an unobserved merge. |
| `decide.md` | `#decide` | A scorecard for choosing between options. |

The manual, auto and file-matched files were ported from the Retort and Mystira agent configurations; the choice of what to port is recorded on the Retort baton ticket for instruction packs.

## Hooks

Six hooks in `.kiro/hooks/`, all on `fileEdited`:

| Hook | Runs on | Action | What it caught |
|---|---|---|---|
| Validate story content | `content/**/*.story.yaml` | validates every content file against the schema | _not yet observed_ |
| Typecheck | `src/**/*.ts(x)` | `tsc --noEmit` | _not yet observed_ |
| Tests for changed files | `src/**/*.ts(x)` | `vitest run --changed` | _not yet observed_ |
| Engine answer leak | `src/engine/**` | engine tests | _not yet observed_ |
| No `childId` | source, content, docs | asks the agent to check for the forbidden identifier | _not yet observed_ |
| Secret guard | `.env*`, `public/config.json` | asks the agent to check for secrets | _not yet observed_ |

The first version used a file shape Kiro accepted but flagged as legacy, with a "Migrate legacy hooks" banner. Kiro migrated all six into the current `.kiro/hooks/<id>.json` format; the triggers and commands were compared with the originals and kept. Review of the first version found two real problems worth showing: a `vitest related` command given no path, and a `${file}` placeholder that Kiro does not document.

## Specs

| Spec | What the requirements or design caught |
|---|---|
| Player core | Requirements, design and tasks describe the continue-only core boundary. The first implementation slice covers scaffold, runtime contracts/node validation and basic LocalEngine scene/profile/session paths. |
| Choices and hotspots | Spec 2 owns choices/hotspots, shared modes/feedback/check confirmation and assessment/research behavior. Requirements, design and tasks are documented. |
| Sequence | Spec 3 requirements, design and tasks are authored; it reuses Spec 2 shared mode machinery and leaves item ordering to the Engine. |
| Inspect | Spec 4 requirements, design and tasks are authored; it reuses Spec 2 shared modes and uses fictional content on reserved .example domains. |

The four rows above are the core interaction specs. Separate support specs are maintained for [legacy story compatibility](../.kiro/specs/legacy-story-compatibility/requirements.md) and [third-party scenarios](../.kiro/specs/third-party-scenarios/requirements.md). PR #13 delivered the first continue-only foundation slice. The follow-on renderer and shell are tracked in the player-core task plan and Baton; the remaining core Engine work, Specs 2–4 interactions, and the Spec 5–6 integrations remain open.

Review of the foundation PR found a session transition that mutated history before checking whether the destination could compile. The implementation now compiles a prospective step first, and a regression test verifies resume and retry after rejection. Review also exposed a missing `startNodeId` path and contradictions in the later interaction specs: check answers require confirmation, including a valid empty inspect answer. The requirements and design were reconciled in the foundation PR; those interaction implementations remain open in their task plans.

The next Spec 1 work is on `feat/player-core-shell`, based on the merged PR #13 commit in `dev`. It adds an Engine-driven scene renderer, Manor theme token contract, audio and media controls, a local demo shell, and focused tests. The local Engine maps a profile switch to the corresponding lesson piece. The player-core task list marks only verified subtasks complete; schema parity, assessment entry points (Spec 2), full audio/request cleanup, and the complete requirement evidence pass remain open.

The source pass reached 55 Vitest tests, typecheck and build. A connected browser pass observed the desktop and narrow layouts, both continue scenes and the end view. Mobile Lighthouse accessibility scored 100 on the landing page and an active scene. The Python JSON-schema content checker could not run because `jsonschema` was absent in the worktree's Python environment; the JSON schema parsed and both Manor stories passed the Zod content tests. Broader schema parity and request cancellation are still open.

## MCP

- **context7** and **playwright** (committed in `.kiro/settings/mcp.json`, launched with `cmd /c npx` because Windows cannot run `npx` directly): current library documentation, and browser control so the agent can open and inspect the running player.
- **[Baton](https://baton.celladoresystems.com)** by Celladore Systems (user-level settings, private): the shared task graph. The four core spec epics and their work tasks, plus separate legacy compatibility and third-party embedding epics, track the remaining delivery work.
- **Mill** by Celladore Systems (user-level settings, runs locally): image conversion for the Manor art, for example PNG to WebP at web quality.
- **Serena** (user-level settings): symbol-level code navigation. Added before this foundation implementation. Kiro's MCP log showed it connecting, but launched through `uvx` the cold start took about 58 of Kiro's 60 seconds, so it was installed once with `uv tool install` and launched from there. Whether it works end to end is not yet confirmed.
- **Mystira workspace** (user-level settings, private): project context from the Mystira platform.

The private servers live in user-level settings because their addresses are internal, and their tokens are read from environment variables; only context7 and playwright are committed.

## Notes for the video

Moments worth showing, added as they happen:

- A stacked pull request silently lost a file: the child merged after its parent, into a branch that no longer mattered, and showed as merged while the file was missing from `dev`.
- Automated review caught two hook commands that looked right and would have done nothing useful.
- The same agent rules, ported from two other agent systems, became steering files with different load behaviour (always, by file, by topic, on request).
