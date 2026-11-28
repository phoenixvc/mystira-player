# Spec 2 verification — 2026-11-28

Implementation branch: `feat/choices-hotspots-impl`, based on merged task 0 commit `6b50c25`.

## Automated checks

- `pnpm test`: 99 passed across 10 files.
- `pnpm build`: TypeScript and Vite production build passed.
- `scripts/check-content.py` with PyYAML and jsonschema: zero problems for `pumpkin-gate.story.yaml` and `core-preview.story.yaml`.
- Malformed-content probes: duplicate YAML key, unknown practice outcome ID, and an unbranched correct hotspot with authored outcomes were each rejected.
- `git diff --check`: passed.

Schema and compiler tests cover stable IDs, authored outcome mapping, nonblank text and image alt text, answer stripping, unsupported interaction gating, and check-node invariants. Engine tests cover first-try scoring, research return, unscored follow-up, idempotent replay, profile-specific piece routing, and Back restrictions. Component tests cover mode classification, feedback precedence and fallback, choice and hotspot submissions, reveal, explicit check confirmation, request-ID reuse, correct-outcome image and line, narration-disabled and failed paths, stalled audio skip, and auto-advance suppression.

## Local browser acceptance

Used the local Vite build in Playwright with the demo controls. The bundled story currently has no image files under `public/assets`, so the player's accessible artwork fallback appeared. The interaction and navigation checks below were still visible and operable.

| Path | Observed result |
|---|---|
| First profile, choice practice | A wrong choice showed the authored hint and kept the current scene. The correct choice advanced to the hotspot practice scene. |
| First profile, hotspot practice | The targets were keyboard-accessible by label. A wrong object showed the hint without a wrong-location marker. |
| First profile, assessment | Selecting a wrong answer enabled confirmation without submitting. Confirming opened the `where → find → verify → use` research path. A tap outside the hotspot showed “Nothing here” and kept the research scene. |
| First profile, follow-up and result | Research returned to attempt 2 with an unscored banner. Confirming the answer produced `0 of 1 correct on the first try`. |
| Second profile, practice | A wrong choice showed the hint. The corrected cross-piece route completed its child-chosen piece after the correct choice. |
| Second profile, assessment | A correct first answer produced `1 of 1 correct on the first try`. The direct follow-up entry opened at attempt 2 with the unscored banner. |
| Authored hotspot reveal | Selecting the correct crow in choice practice displayed “The crow was right there!” over its region and a Next action before submission. |
| Authored result | A correct first assessment answer displayed “The gate opens”, its narrator line, `1 of 1 correct on the first try`, “The pumpkin key”, and Play again. |
| Fixed-profile practice completion | The choice and hotspot preview completed after the crow reveal and Next, before the bundled inspect scene that is outside this slice. |

The optional `on_correct` image and line are covered with synthetic component content; the bundled Pumpkin Gate story does not currently author that optional presentation. Retry idempotency is covered by Engine and component tests; the local Engine does not simulate a network failure in the browser.

The two findings from the first Codex review of PR #20 were addressed: authored result content now uses the normal scene renderer, and an authored hotspot reveal remains visible until Next submits the answer.

The five CodeRabbit findings were also addressed: correct hotspot outcomes require a selectable branch; the fixed-profile preview stops before unsupported inspect content; all direct follow-up questions begin unscored; explanation audio failure starts speech fallback once; and scene-line navigation stays disabled during a held explanation. The multi-question follow-up and audio failure paths have focused regression tests.
