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
| Player core (`.kiro/specs/player-core/`) | _requirements written; design and tasks not started_ |

Further specs (choices and hotspots, sequence, inspect) are planned and not yet written.

## MCP

- **context7** and **playwright** (committed in `.kiro/settings/mcp.json`, launched with `cmd /c npx` because Windows cannot run `npx` directly): current library documentation, and browser control so the agent can open and inspect the running player.
- **[Baton](https://baton.celladoresystems.com)** by Celladore Systems (user-level settings, private): the shared task graph. Work stayed visible across Kiro sessions and between the two of us. _Screenshot to add._
- **Mill** by Celladore Systems (user-level settings, runs locally): image conversion for the Manor art, for example PNG to WebP at web quality.
- **Serena** (user-level settings, launched with `uvx`): symbol-level code navigation. Added after the design was written; no code exists yet for it to index, and whether Kiro connects to it is not yet confirmed.
- **Mystira workspace** (user-level settings, private): project context from the Mystira platform.

The private servers live in user-level settings because their addresses are internal, and their tokens are read from environment variables; only context7 and playwright are committed.

## Notes for the video

Moments worth showing, added as they happen:

- A stacked pull request silently lost a file: the child merged after its parent, into a branch that no longer mattered, and showed as merged while the file was missing from `dev`.
- Automated review caught two hook commands that looked right and would have done nothing useful.
- The same agent rules, ported from two other agent systems, became steering files with different load behaviour (always, by file, by topic, on request).
