# Implementation Plan: choices-hotspots

Spec 2 follows the core contracts and continue-only renderer. Specs 3 and 4 depend on the shared machinery defined here.

- [ ] 1. Complete choice/hotspot schemas and config gating.
  - [ ] 1.1 Validate stable choice/object IDs, labels, positions and practice-local data.
  - [ ] 1.2 Enforce check-only schema invariants and attempt/scoring consistency.
  - Requirements: CH1–CH3
- [ ] 2. Compile the assessment path.
  - [ ] 2.1 Keep check answers Engine-private and compile first-attempt check nodes.
  - [ ] 2.2 Compile research scenes and lesson results.
  - [ ] 2.3 Enforce check back-navigation and unscored follow-up behavior.
  - Requirements: CH3
- [ ] 3. Implement shared mode and practice behavior.
  - [ ] 3.1 Add the total open/practice/check classifier with check precedence.
  - [ ] 3.2 Build practice-local data without raw content answer fields.
  - [ ] 3.3 Add feedback selection, gentle shake/low tone, revealAfter and final selection.
  - Requirements: CH4–CH5
- [ ] 4. Implement choice and hotspot interactions.
  - [ ] 4.1 Render accessible choices and submit stable choice IDs.
  - [ ] 4.2 Render accessible hotspot targets and submit stable object IDs.
  - [ ] 4.3 Reuse practice behavior and suppress explicit wrong-location marks.
  - Requirements: CH1–CH2, CH4–CH5
- [ ] 5. Implement check confirmation and score feedback.
  - [ ] 5.1 Require selection and explicit confirmation.
  - [ ] 5.2 Disable submission in flight and preserve request IDs across retries.
  - [ ] 5.3 Explain first-attempt and unscored-follow-up behavior.
  - Requirements: CH3, CH6
- [ ] 6. Verify Spec 2 and publish the shared contract.
  - [ ] 6.1 Add schema, compiler, component and mode property tests.
  - [ ] 6.2 Verify answer privacy, scoring, navigation and config gating.
  - [ ] 6.3 Document the mode/feedback API for Specs 3 and 4.
  - Requirements: CH1–CH6
