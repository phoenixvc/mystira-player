# Tasks: inspect

- [x] 1. Define inspect schema and answer types
  - [x] 1.1 Add document kinds, part roles, 3..8 unique parts and optional image metadata.
  - [x] 1.2 Validate `minMarks` and transformed practice flags; keep raw answers Engine-private.
- [x] 2. Add fictional inspect fixtures
  - [x] 2.1 Use invented identities and reserved `.example` domains only.
  - [x] 2.2 Render link/button roles as inert document parts.
- [x] 3. Build the inspect renderer
  - [x] 3.1 Render message/page/sign hierarchy and toggle part selection.
  - [x] 3.2 Add minimum-count Done behavior and the explicit empty-selection action for `minMarks: 0`.
  - [x] 3.3 Support keyboard use, focus retention, selected-state semantics and status announcements.
- [x] 4. Integrate shared modes
  - [x] 4.1 Reuse Spec 2 open/practice/check behavior, feedback and reveal contract.
  - [x] 4.2 Use shared check confirmation and submit stable part IDs to the Engine.
- [x] 5. Verify inspect behavior
  - [x] 5.1 Add schema, renderer, mode, accessibility and safety tests.
  - [x] 5.2 Add property coverage for selection determinism and explicit-only submission.
