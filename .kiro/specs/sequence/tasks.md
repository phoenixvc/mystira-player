# Tasks: sequence

- [ ] 1. Define sequence schema and answer types
  - [ ] 1.1 Add bounded 3..5 item schema with stable unique IDs and optional image metadata.
  - [ ] 1.2 Add sequence answer typing and validate transformed practice order as an exact permutation.
- [ ] 2. Compile sequence content
  - [ ] 2.1 Preserve Engine-supplied item order and keep raw source answers private.
  - [ ] 2.2 Gate sequence support through `config.interactions.enabled`.
- [ ] 3. Build the accessible sequence renderer
  - [ ] 3.1 Add ordered placement, remaining items, Undo and explicit Done controls.
  - [ ] 3.2 Support pointer/touch and keyboard operation, focus retention and live announcements.
  - [ ] 3.3 Apply density and reduced-motion behavior.
- [ ] 4. Integrate shared modes
  - [ ] 4.1 Reuse Spec 2 open/practice/check behavior, feedback and reveal contract.
  - [ ] 4.2 Use shared check confirmation and submit stable ordered IDs to the Engine.
- [ ] 5. Verify sequence behavior
  - [ ] 5.1 Add schema, compiler, reducer/component and accessibility tests.
  - [ ] 5.2 Add property coverage proving no implicit submit and stable item order.
