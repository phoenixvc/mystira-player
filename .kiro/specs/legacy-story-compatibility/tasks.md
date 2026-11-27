# Implementation Plan: Legacy Story Compatibility

All items are open. Spec 5 follows the four Kiroween specs and is the gate for replacing the old Blazor story surface. Mark an item done only with linked fixture/test or hosted evidence.

- [ ] 1. Inventory the live Blazor story contract and record a compatibility matrix.
  - [ ] 1.1 Refresh `source-audit.md` against the integration branch: scene-type names/numeric values, DTO shapes, roll/special/3D semantics, session transitions, assignments, AI turns, narration, audio, settings and awards. Confirm the current no-op Rewind handler.
  - [ ] 1.2 Select non-sensitive story fixtures and sanitized API snapshots, including roll, special, 3D, branching, and terminal paths.
  - [ ] 1.3 Mark every case supported, host-rendered, unsupported, or not applicable; reconcile the PRD's blanket compatibility claim.
  - Requirements: 1

- [ ] 2. Build and test the legacy-to-`Step` adapter.
  - [ ] 2.1 Normalize YAML and current Blazor DTO scene-type vocabularies without silent narrative fallback.
  - [ ] 2.2 Map IDs, branches, ordered choices, compass metadata, active character/portrait, Markdown, narration timing, music/SFX cues, media and exit state; resolve relative and protected media references.
  - [ ] 2.3 Add table-driven fixtures for every in-scope type and a typed unsupported result for unknown behavior.
  - Requirements: 2

- [ ] 3. Preserve old story lifecycle through the host engine.
  - [ ] 3.1 Bridge start/resume/respond to existing authorized session services.
  - [ ] 3.2 Follow branch destinations and preserve pause/resume; expose Back only after an authoritative host checkpoint contract exists, and add a generic terminal representation distinct from assessment results.
  - [ ] 3.3 Add idempotency, stale-version, terminal, unmount/remount, and failure-path contract tests.
  - Requirements: 3

- [ ] 4. Add the roll capability.
  - [ ] 4.1 Extend the interaction/answer/node schemas with ready and resolved roll states behind an explicit capability flag.
  - [ ] 4.2 Render roll, returned outcome, Continue, focus movement, and reduced-motion fallback.
  - [ ] 4.3 Map the existing roll computation and success/failure navigation into the host engine, including malformed-branch fallback.
  - [ ] 4.4 Test stable request IDs, retry, remount after resolution, and no double roll or branch navigation.
  - Requirements: 4

- [ ] 5. Handle special scenes and 3D media.
  - [ ] 5.1 Classify actual special and 3D fixtures by behavior before choosing direct rendering or a host scene-stage extension.
  - [ ] 5.2 Implement the bounded extension with poster/fallback, accessible focus, asset resolution, and cleanup.
  - [ ] 5.3 Test missing-extension recovery and continuity through the next scene.
  - Requirements: 5

- [ ] 6. Embed the player in Blazor without moving host chrome into it.
  - [ ] 6.1 Add a Blazor wrapper and JS-interop host engine bridge; supply theme, notes permission, media resolver and authorized session context.
  - [ ] 6.2 Wire sanitized lifecycle events to existing host services for rails, guide, settings, music, telemetry, exit and awards; preserve profile/guest/AI assignments and gate human input on AI turns.
  - [ ] 6.3 Test no element-owned API calls, host URL changes, CSS leakage, sensitive event payloads, or audio after unmount.
  - [ ] 6.4 Connect host audio orchestration to narration word seek/highlight, scene cues and media actions with one audio owner per channel; preserve host volume/text settings and first-gesture unlock.
  - Requirements: 6

- [ ] 7. Run the compatibility and release gate.
  - [ ] 7.1 Replay matched old/new fixture paths and compare scene/branch/roll/session outcomes, choice index/compass, player attribution, AI turns and finalization.
  - [ ] 7.2 Run element and Blazor harness accessibility, media, retry, mount/remount, and reduced-motion checks.
  - [ ] 7.3 Deploy behind a reversible host flag and obtain signed-in story acceptance; record any remaining unsupported cases and narrow the public claim accordingly.
  - Requirements: 1–7
