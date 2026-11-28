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
| Choices and hotspots | Spec 2 owns choices/hotspots, shared modes/feedback/check confirmation and assessment/research behavior. A later product decision approved answer-specific wrong-choice feedback and a changed image with an explanatory line after a correct practice choice; task 0 froze the authoring shape and fallbacks. |
| Sequence | Spec 3 requirements, design and tasks are authored; it reuses Spec 2 shared mode machinery and leaves item ordering to the Engine. |
| Inspect | Spec 4 requirements, design and tasks are authored; it reuses Spec 2 shared modes and uses fictional content on reserved .example domains. |

The four rows above are the core interaction specs. Separate support specs are maintained for [legacy story compatibility](../.kiro/specs/legacy-story-compatibility/requirements.md) and [third-party scenarios](../.kiro/specs/third-party-scenarios/requirements.md). PR #13 delivered the first continue-only foundation slice. PR #14 delivered the renderer and shell, completing Spec 1's continue-only scope. Specs 2–4 interactions and the Spec 5–6 integrations remain open.

Review of the foundation PR found a session transition that mutated history before checking whether the destination could compile. The implementation now compiles a prospective step first, and a regression test verifies resume and retry after rejection. Review also exposed a missing `startNodeId` path and contradictions in the later interaction specs: check answers require confirmation, including a valid empty inspect answer. The requirements and design were reconciled in the foundation PR; those interaction implementations remain open in their task plans.

The second Spec 1 slice was developed on `feat/player-core-shell`, based on the merged PR #13 commit in `dev`. It added an Engine-driven scene renderer, Manor theme token contract, audio and media controls, a local demo shell, and focused tests. The local Engine maps a profile switch to the corresponding lesson piece and supplies piece starts for a `child_chooses` profile. Story YAML field parity, generated round trips and session properties are covered. The player-core task list marks verified continue-only subtasks complete. Assessment and follow-up entry-point enablement is assigned to Spec 2 CH3.9/task 2.4 because that spec owns the nodes and interactions they require.

The source pass reached 74 Vitest tests, typecheck and build. A connected browser pass observed the desktop and narrow layouts, both continue scenes and the end view. Mobile Lighthouse accessibility scored 100 on the landing page and an active scene. Running `scripts/check-content.py` through `uv` with `jsonschema` and `pyyaml` reported zero problems for both Manor stories. A draft Codex review was triggered with `@codex review`; it found that media controls could invalidate a pending navigation response and a rejected audio play promise could start cancelled fallback speech. Playback and request generations are now separate, fallback speech checks the playback generation, and the player aborts an optional Engine request signal on unmount or session switch. Regression tests cover both findings, abort, video cleanup, density, a late response after a story switch, and a failed restart.

The [core acceptance evidence](../.kiro/specs/player-core/verification.md) maps each continue-only requirement to implementation and observed checks. Spec 1 Requirement 19.3 now requires the lesson entry to work and unavailable entry points to remain disabled. The deferred assessment and follow-up behavior is explicit in Spec 2 CH3.9/task 2.4. This reconciles the core acceptance pass without claiming the full Manor assessment path is implemented. A second draft Codex review was requested after the schema and child-chosen piece changes.

The Spec 1 design's demo-control and coverage notes were reconciled with the actual shell boundary and verification state. They now point to `src/app/App.tsx` and the evidence map instead of describing an unbuilt control component. The assessment entry-point criterion was later moved to the existing Spec 2 assessment work, and the core task plan was checked only for its continue-only scope.

That second review found a callout clipping issue near the stage edges. The renderer now positions each callout within an inset region and translates it by its own anchor fraction, keeping the full box inside the picture. A browser geometry check at 400 px and 280 px stage widths covered all four corners and the center; every tested box stayed at least 11 px inside the stage border. The 74-test suite, typecheck and build passed after the fix.

The next exact-head review caught that a height-constrained callout could not be scrolled because its inset region ignored pointer events and it had no keyboard focus. The callout now accepts pointer events, is keyboard focusable, and uses its available width before wrapping. A 280 px browser check confirmed a tall right-edge callout stayed within the stage, received focus, and scrolled to its remaining text.

Marking PR #14 ready triggered a CodeRabbit review. It found that an unstable host `onStep` callback could restart a session, a rapid second profile change could lose the pending lesson piece, and malformed non-object `interaction` values could pass Story YAML validation. The player now reads the latest callback through a ref, the shell maps from a pending scene ID while a new Step loads, and the Story YAML schema validates both declared interaction variants. Focused regressions brought the suite to 77 tests; typecheck and build passed. The automatic CodeRabbit follow-up on that head was rate limited and skipped analysis.

Codex then reviewed that head and found that the first user gesture could restart 6–9 narration already playing. The player now tracks narration started for each Step, so only a young-child Step waiting for its first gesture starts on that event. Regression tests cover both age paths. The suite reached 79 tests, with typecheck and build passing.

PR #14 merged into `dev` as `cf530e6` after an exact-head Codex review of `417525c` found no issues and all seven review threads were resolved. CodeRabbit's current-head run was neutral because rate limiting skipped analysis; the product owner chose to merge with the completed review and local verification. This merge closes Spec 1's continue-only delivery, without claiming the Spec 2 assessment path is playable.

For Spec 2, the product owner approved answer-specific wrong-choice feedback and an optional changed scene image plus explanatory line after a correct practice choice, before Next (Baton decision `e3f1c06f`). The requirements recorded this behavior, and PR #15 proposed `practice.outcomes` keyed by stable choice/object ID, with keyed wrong feedback taking precedence over per-try `on_wrong`, then `hint`, then the built-in message. That PR left the exact YAML field names, validation and narration fallback for task 0 review. Check answers remain Engine-private, and the demo assessment and follow-up options stay disabled until Spec 2's nodes and interactions are verified. The contract update made no implementation or test claim for Spec 2.

The task 0 design pass froze `practice.outcomes` as an optional ID-keyed map for choice/hotspot practice. Wrong IDs may carry specific `on_wrong` narration; only the correct choice ID may carry `on_correct` with a required line and optional image with required alt text. It requires explicit unique branch IDs, valid object IDs, known outcome keys, non-blank text, and rejection of duplicate YAML keys. Keyed wrong feedback takes precedence over the existing per-try ladder. A correct outcome keeps the current node active; narration finishes or an explicit skip occurs before Next, while disabled or unavailable narration exposes Next after the line text appears. Next submits the held answer once with the existing request-id retry rule. The design was checked against the Story YAML, interaction and Engine types; `docs/tech-spec.md` and `docs/content-format.md` recorded the frozen contract before implementation.

The Spec 2 implementation branch adds the outcome schema and duplicate-key content check, typed local outcome mapping, shared open/practice/check mode and feedback helpers, choice and hotspot controls, explicit check confirmation, Engine-private first-try scoring, research return and unscored follow-up, and demo entry points gated on both interactions. The core continue-only preview remains the lesson entry while Pumpkin Gate practice and assessment use a separate local Engine; this avoids presenting the later sequence and inspect lesson pieces as playable. The task list records the implemented scope. Unit and integration tests cover schema rejection, compilation, retry idempotency, assessment privacy and scoring, feedback precedence, hotspot reveal, and correct-outcome audio skip. The content checker reported zero problems for both bundled stories with its Python dependencies installed in a temporary directory. The [Spec 2 verification record](../.kiro/specs/choices-hotspots/verification.md) captures 99 passing tests, the production build, and local browser acceptance for both demo profiles. Browser verification found a profile-version routing bug, which was fixed and regression-tested before the final pass.

Spec 3 builds on the merged Spec 2 branch. The Engine supplies stable mixed sequence order, validates answers, and keeps check answers private. The renderer places items in order with Undo and explicit Done, reusing open/practice/check behavior, feedback, reveal and check confirmation. The local demo exposes the authored sequence only for its matching profile. The [Spec 3 verification record](../.kiro/specs/sequence/verification.md) maps the requirements to 109 passing tests, a production build, content validation and a keyboard/browser pass through wrong feedback, correction and completion. Inspect and the full fixed-profile lesson remain for Spec 4.

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
