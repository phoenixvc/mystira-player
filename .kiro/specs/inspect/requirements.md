# Requirements: inspect

## Introduction

Spec 4 of the four core interaction specs. It defines an interaction in which a child examines a fictional message, page or sign and marks the parts that provide evidence. Shared open, practice and check behavior comes from [choices-hotspots](../choices-hotspots/requirements.md). Inspect content uses invented names and reserved `.example` domains only.

## Requirements

### Requirement 1: Inspect content schema

**User Story:** As a content author, I want to describe a fictional document as typed parts, so a child can inspect it safely and accessibly.

#### Acceptance Criteria

1. THE Inspect Schema SHALL accept document kinds `message`, `page` and `sign`, a title, and 3 to 8 parts.
2. EACH part SHALL have a stable unique `id`, a supported role (`sender`, `heading`, `text`, `link`, `button`, `image`, `price` or `footer`), and text with optional image URL and alt text.
3. THE Inspect Schema SHALL accept optional `minMarks` from 0 through the number of parts and SHALL default it to 1.
4. THE Inspect Schema SHALL reject duplicate part IDs, unsupported roles, invalid minimums and documents outside the supported part count.
5. Inspect fixtures SHALL use invented identities/brands and reserved `.example` domains; they SHALL NOT direct a child to a real service or collect credentials.

### Requirement 2: Inspect rendering and selection

**User Story:** As a child, I want to mark parts of a document that look suspicious, so I can show what gives it away.

#### Acceptance Criteria

1. THE Inspect Renderer SHALL present the document structure and visual hierarchy according to its `kind` and each part's role.
2. WHEN a part is activated, THE Inspect Renderer SHALL toggle that part's selected state without advancing or submitting the node.
3. THE Inspect Renderer SHALL show selected parts clearly and expose selected state to assistive technology.
4. THE Inspect Renderer SHALL provide keyboard-operable part controls with visible focus and meaningful accessible names.
5. WHEN `minMarks` is zero, THE Inspect Renderer SHALL show a “Nothing is wrong” action that submits an empty selection.

### Requirement 3: Submission

**User Story:** As a child, I want to review my marks before sending them, so I can correct accidental taps.

#### Acceptance Criteria

1. THE Inspect Renderer SHALL provide an explicit Done action and SHALL NOT submit on part selection.
2. THE Done action SHALL remain disabled until the selected count meets `minMarks`, except that “Nothing is wrong” submits the permitted empty selection.
3. WHEN Done is activated, THE Player SHALL submit an answer of kind `inspect` with the selected stable part IDs in document order.
4. Check-mode submissions SHALL use the shared confirmation flow defined in Spec 2.

### Requirement 4: Shared modes and answer privacy

1. THE Inspect Renderer SHALL use the shared mode classifier and practice feedback contract defined in Spec 2.
2. IN open and check modes, THE Player SHALL submit to the Engine without determining correctness locally.
3. IN practice mode, THE Player MAY compare selected IDs with transformed `local.flagged` data and SHALL use the shared feedback ladder and `revealAfter` behavior.
4. THE LocalEngine SHALL NOT copy raw source answers onto renderer nodes; check answers remain Engine-private.

### Requirement 5: Accessibility and safety

1. THE Inspect Renderer SHALL meet the active age-density target for controls and tap targets.
2. THE Inspect Renderer SHALL announce selection changes and the minimum selection requirement to assistive technology.
3. WHERE reduced motion is enabled, THE Inspect Renderer SHALL avoid non-essential motion while retaining a clear selected state.
4. Inspect document content SHALL remain fictional, including when link or button roles are rendered; controls SHALL NOT navigate to real destinations.
5. Inspect controls SHALL remain usable while dialogue audio plays; interaction input stops current speech through the core lifecycle.

### Requirement 6: Configuration and unsupported behavior

1. WHEN `inspect` is absent from `config.interactions.enabled`, THE Engine SHALL return the shared unsupported state for inspect content.
2. WHEN `inspect` is enabled, THE standalone demo SHALL not require app-specific knowledge of child identity.
