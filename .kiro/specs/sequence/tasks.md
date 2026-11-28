# Tasks: sequence

- [x] 1. Define sequence schema and answer types
  - [x] 1.1 Add bounded 3..5 item schema with stable unique IDs and optional image metadata.
  - [x] 1.2 Add sequence answer typing and validate transformed practice order as an exact permutation.
- [x] 2. Compile sequence content
  - [x] 2.1 Preserve Engine-supplied item order and keep raw source answers private.
  - [x] 2.2 Gate sequence support through `config.interactions.enabled`.
- [x] 3. Build the accessible sequence renderer
  - [x] 3.1 Add ordered placement, remaining items, Undo and explicit Done controls.
  - [x] 3.2 Support pointer/touch and keyboard operation, focus retention and live announcements.
  - [x] 3.3 Apply density and reduced-motion behavior.
- [x] 4. Integrate shared modes
  - [x] 4.1 Reuse Spec 2 open/practice/check behavior, feedback and reveal contract.
  - [x] 4.2 Use shared check confirmation and submit stable ordered IDs to the Engine.
- [x] 5. Verify sequence behavior
  - [x] 5.1 Add schema, compiler, reducer/component and accessibility tests.
  - [x] 5.2 Add property coverage proving no implicit submit and stable item order.
