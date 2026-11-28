# Design: sequence

## Overview

Spec 3 adds the sequence interaction on top of the shared contracts in player-core and choices-hotspots. The engine supplies a shuffled item list. The Player preserves that order, collects the child's ordered answer, and submits only when the child activates Done.

## Ownership

- `player-core` owns the Engine/session protocol, shared node base, presentation, density, audio lifecycle and generic navigation.
- `choices-hotspots` owns mode classification, practice feedback, reveal behavior, answer privacy and check confirmation.
- This spec owns the sequence interaction schema, ordered answer state, sequence renderer and its tests.
- The Engine owns correctness and initial item shuffling. The renderer does not branch on child identity or generate a new order.

## Runtime contract

```typescript
interface SequenceItem {
  id: string;
  label: string;
  imageUrl?: string;
  alt?: string;
}

interface SequenceInteraction {
  type: "sequence";
  items: SequenceItem[]; // Engine-supplied display order, 3..5 items
  local?: {
    order: string[]; // transformed practice-only answer; never raw YAML
    feedback?: Feedback;
  };
}

type SequenceAnswer = { kind: "sequence"; itemIds: string[] };
```

Validate item count and unique stable IDs in the interaction schema. At compilation time, preserve the Engine-supplied item array exactly. Validate `local.order` as an exact permutation of the item IDs when practice data exists. Do not expose the source YAML answer outside the Engine's transformed local block.

## Renderer state and submission

`SequenceView` maintains an ordered list of selected item IDs and derives the remaining items from `node.items`. Selecting an item appends its ID. Undo removes the last selected ID. Done is enabled when the answer is complete and submits `{ kind: "sequence", itemIds }`; it never submits on the final placement. A check-mode submission uses Spec 2's confirmation component before calling the session response handler.

Prefer a single accessible ordered answer list and a separate remaining-items list. Provide labelled “Place [item]” and “Undo last item” controls so pointer, touch, keyboard and assistive-technology users share the same state transitions. Announce placement and Undo through a polite live region. Preserve focus on the associated control after state changes.

The exact comparison for practice uses `local.order`. A wrong answer calls the shared feedback ladder with the current wrong-try count; after `revealAfter`, identify or pulse the target item as specified by Spec 2, but leave the final placement to the child. Open and check modes submit directly to the Engine (check mode through confirmation); no local correctness message is shown.

## Accessibility and presentation

Use the active density tokens for minimum target size, spacing and text sizing. Authored item images require non-blank alt text; authors can omit an image when the text label is sufficient. Text labels remain present even when an image is supplied. Respect reduced motion. Sequence controls remain active while speech plays; interaction activation cancels speech through the core audio lifecycle.

## Testing strategy

- Schema tests: 3 and 5 items accepted; 2 and 6 rejected; duplicate IDs rejected; optional image metadata accepted.
- Compiler tests: item order is retained exactly; raw source answer is absent; transformed practice order is an exact permutation.
- Reducer/component tests: place items, Undo last item, Done submits the exact order once, final placement does not submit, focus and live announcements work.
- Mode tests: open/check answers go to Engine; check uses shared confirmation; practice uses shared feedback and reveal threshold.
- Accessibility tests: keyboard-only completion, accessible names/status, density target, reduced-motion behavior.
- Property: for any valid item permutation and placement/Undo sequence, selected IDs remain unique and ordered according to the child's actions; submission occurs only after explicit Done.

## Cross-spec reuse

Use the shared mode, feedback, answer submission, confirmation and audio contracts from Specs 1 and 2. Do not add a sequence-specific mode classifier or shuffle source.
