# Tasks: inspect

- [ ] 1. Define inspect schema and answer types
  - [ ] 1.1 Add document kinds, part roles, 3..8 unique parts and optional image metadata.
  - [ ] 1.2 Validate `minMarks` and transformed practice flags; keep raw answers Engine-private.
- [ ] 2. Add fictional inspect fixtures
  - [ ] 2.1 Use invented identities and reserved `.example` domains only.
  - [ ] 2.2 Render link/button roles as inert document parts.
- [ ] 3. Build the inspect renderer
  - [ ] 3.1 Render message/page/sign hierarchy and toggle part selection.
  - [ ] 3.2 Add minimum-count Done behavior and the explicit empty-selection action for `minMarks: 0`.
  - [ ] 3.3 Support keyboard use, focus retention, selected-state semantics and status announcements.
- [ ] 4. Integrate shared modes
  - [ ] 4.1 Reuse Spec 2 open/practice/check behavior, feedback and reveal contract.
  - [ ] 4.2 Use shared check confirmation and submit stable part IDs to the Engine.
- [ ] 5. Verify inspect behavior
  - [ ] 5.1 Add schema, renderer, mode, accessibility and safety tests.
  - [ ] 5.2 Add property coverage for selection determinism and explicit-only submission.
