# Requirements: sequence

## Introduction

Spec 3 of the four core interaction specs. It defines the `sequence` interaction and its renderer/answer contract. Shared open, practice and check behavior, feedback, answer privacy and check confirmation come from [choices-hotspots](../choices-hotspots/requirements.md). The item order is engine-owned; the player never shuffles items.

## Requirements

### Requirement 1: Sequence content schema

**User Story:** As a content author, I want to define a bounded list of ordered items, so a child can arrange them into a meaningful sequence.

#### Acceptance Criteria

1. THE Sequence Schema SHALL accept 3 to 5 items, each with a stable unique `id`, a text `label`, and optional `imageUrl` and `alt` text.
2. THE Sequence Schema SHALL reject duplicate item IDs and lists outside the supported item count.
3. THE runtime node SHALL carry any practice-only correct order only in the transformed `local` block defined by Spec 2; raw story answer fields SHALL NOT be copied to the renderer node.

### Requirement 2: Engine-supplied item order

**User Story:** As a child, I want the items presented in a mixed order, so I can arrange them myself.

#### Acceptance Criteria

1. THE Engine SHALL supply the initial item order in the sequence node.
2. THE Player SHALL render items in the supplied order and SHALL NOT shuffle or otherwise reorder them during initialization.
3. WHEN a session resumes with the same current sequence node, THE Player SHALL render the order supplied by that node and SHALL NOT generate a new order.

### Requirement 3: Sequence interaction

**User Story:** As a child, I want to place items in order and correct my work before submitting.

#### Acceptance Criteria

1. THE Sequence Renderer SHALL let the child place each item into an ordered answer list using pointer or keyboard input.
2. THE Sequence Renderer SHALL provide an Undo action that removes the most recently placed item without losing the remaining order.
3. THE Sequence Renderer SHALL provide an explicit Done action and SHALL NOT submit automatically when all items are placed.
4. WHEN Done is activated, THE Player SHALL submit an answer of kind `sequence` containing the selected item IDs in their chosen order.
5. THE Sequence Renderer SHALL identify placed and remaining items to assistive technology and SHALL expose keyboard-operable controls.

### Requirement 4: Shared modes and feedback

**User Story:** As a child, I want sequence interactions to behave like other interactions in each mode.

#### Acceptance Criteria

1. THE Sequence Renderer SHALL use the shared mode classifier and practice feedback contract defined in Spec 2.
2. IN open and check modes, THE Player SHALL submit the answer to the Engine without determining correctness locally.
3. IN practice mode, THE Player MAY compare the answer to the transformed `local.order` value and SHALL use Spec 2's feedback ladder and `revealAfter` behavior.
4. THE Player SHALL preserve the explicit Done/confirmation flow for check submissions.

### Requirement 5: Presentation and accessibility

**User Story:** As a child using different devices or input methods, I want sequence controls that are clear and usable.

#### Acceptance Criteria

1. THE Sequence Renderer SHALL meet the active age-density target for controls and tap targets.
2. THE Sequence Renderer SHALL provide visible focus, accessible labels and status announcements for placement and Undo.
3. WHERE reduced motion is enabled, THE Sequence Renderer SHALL avoid non-essential movement while preserving state feedback.
4. Sequence controls SHALL remain usable while dialogue audio is playing; interaction input stops current speech according to the shared audio lifecycle.

### Requirement 6: Configuration and unsupported behavior

1. WHEN `sequence` is absent from `config.interactions.enabled`, THE Engine SHALL return the shared unsupported state for sequence content.
2. WHEN `sequence` is enabled, THE standalone demo SHALL render the interaction without requiring app-specific knowledge of child identity.
