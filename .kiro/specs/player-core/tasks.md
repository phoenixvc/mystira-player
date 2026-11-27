# Implementation Plan

Tasks are grouped by implementation boundary. Checked items are present in the current feature branch and have been verified; unchecked items remain. This core list covers Requirements 1–12 and 16–21 only.

## Four-spec scope and cleanup

- [x] 1. Align core requirements, design and tasks with the four-spec boundary.
  - [x] 1.1 Confirm four total specs: player-core; choices/hotspots; sequence; inspect.
  - [x] 1.2 Assign shared practice/check behavior and assessment/research flow to Spec 2.
  - [x] 1.3 Move assessment/research/result compilation, practice answers, check-specific schema/scoring and shared mode/check-confirmation design to Spec 2.
  - [x] 1.4 Reconcile the core task list with the corrected requirements and design.

## Implementation tasks

- [x] 2. Create the app scaffold and test runner.
  - [x] 2.1 Configure Vite, React 19, strict TypeScript and pnpm.
  - [x] 2.2 Add the root module entry and local runtime configuration.
  - [x] 2.3 Configure Vitest and verify the build and test command.
  - Requirements: 1
- [ ] 3. Complete runtime schemas and Engine contracts.
  - [x] 3.1 Define core Engine, Step, answer, player and error types without childId.
  - [x] 3.2 Add base node schemas, character-slot validation and enabled-interaction validation.
  - [ ] 3.3 Complete the Story YAML 2.1 schema against the JSON schema.
  - [ ] 3.4 Add core schema, required-field and round-trip coverage.
  - [ ] 3.5 Run the core node and story round-trip properties.
  - Requirements: 2–4
- [ ] 4. Complete the continue-only LocalEngine path.
  - [x] 4.1 Compile supported basic scenes with narrator fallback.
  - [x] 4.2 Select the configured profile version and expose the chosen scene.
  - [ ] 4.3 Map core scene fields, including music.
  - [ ] 4.4 Complete generic session safety; practice/check answers belong to Spec 2.
  - [x] 4.5 Verify idempotency, stale-version conflicts and previous-scene navigation.
  - [ ] 4.6 Complete start-node selection, failed-answer history and session end.
  - [ ] 4.7 Add compiler/session property tests.
  - Requirements: 5, 6, 8
- [ ] 5. Build the engine-agnostic scene player and navigation.
  - [ ] 5.1 Add the player root and render nodes from the Engine interface.
  - [ ] 5.2 Render image/video media and video end/skip behavior.
  - [ ] 5.3 Render characters, unique slots, reactions and reduced motion.
  - [ ] 5.4 Render dialogue, recorded audio, speech synthesis, replay and fallback.
  - [ ] 5.5 Render overlays and task text on core scene nodes.
  - [ ] 5.6 Add visible, keyboard-operable Next and conditional Back.
  - [ ] 5.7 Test renderer components and fallback paths.
  - Requirements: 9–12
- [ ] 6. Add grown-up notes, age density and audio lifecycle.
  - [ ] 6.1 Show rationale notes only in permitted grown-up/demo contexts.
  - [ ] 6.2 Apply age-group sizing and narration defaults.
  - [ ] 6.3 Stop audio, speech, video and requests on node change or unmount.
  - [ ] 6.4 Test visibility, density and cleanup.
  - Requirements: 16–18
- [ ] 7. Add demo controls and the Manor visual system.
  - [ ] 7.1 Add local-demo profile/entry-point switches and notes toggle.
  - [ ] 7.2 Implement theme tokens, Manor theme and CSS Modules.
  - [ ] 7.3 Verify contrast and reduced-motion styling.
  - [ ] 7.4 Test demo visibility, controls and contrast.
  - Requirements: 19–20
- [ ] 8. Implement configurable scene auto-advance.
  - [ ] 8.1 Finalize the content field and update JSON schema, Zod schema and docs.
  - [ ] 8.2 Advance only continue scenes after dialogue; retain visible Next.
  - [ ] 8.3 Test enabled, disabled, non-continue and unavailable-audio cases.
  - Requirements: 21
- [ ] 9. Run the core acceptance pass.
  - [ ] 9.1 Validate core Manor content against the final schema.
  - [ ] 9.2 Run typecheck, core tests, build and accessibility harness.
  - [ ] 9.3 Confirm every core requirement has implementation and verification evidence.
  - Requirements: 1–12, 16–21
