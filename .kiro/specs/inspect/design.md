# Design: inspect

## Overview

Spec 4 adds inspect interactions: the child reads a fictional message, page or sign, marks suspicious parts, then submits the selected part IDs. It reuses shared Engine, session, mode, feedback, check-confirmation and presentation contracts.

## Ownership

- `player-core` owns the Engine/session protocol, scene presentation, density, audio lifecycle and generic navigation.
- `choices-hotspots` owns shared modes, practice feedback/reveal, answer privacy and check confirmation.
- This spec owns inspect schema, document presentation, part selection and inspect-specific verification.
- Content remains fictional and uses `.example` domains; displayed links and buttons are inert.

## Runtime contract

```typescript
type PartRole = "sender" | "heading" | "text" | "link" | "button" | "image" | "price" | "footer";

type InspectDocument = {
  kind: "message" | "page" | "sign";
  title: string;
  parts: Array<{
    id: string;
    role: PartRole;
    text: string;
    imageUrl?: string;
    alt?: string;
  }>;
};

interface InspectInteraction {
  type: "inspect";
  document: InspectDocument; // 3..8 uniquely identified parts
  minMarks?: number; // defaults to 1; zero permits an empty response
  local?: { flagged: string[]; feedback?: Feedback }; // practice only
}

type InspectAnswer = { kind: "inspect"; partIds: string[] };
```

Validate the role enum, document kind, part bounds, unique IDs and `minMarks` range. Treat links and buttons as visual document parts; do not render them as outbound navigation or executable actions. Keep the raw source `practice.answer.parts` inside the Engine and expose only the transformed `local.flagged` practice value.

## Renderer and state

`InspectView` renders the document using role-specific layout: sender/heading metadata, readable text blocks, distinct link/button styling, image alternatives, price callouts and footer. Part selection is a toggle keyed by stable part ID. Selection alone never answers or advances.

Done submits the selected IDs once the configured minimum is met. `minMarks: 0` also renders an explicit “Nothing is wrong” action which submits an empty list. In check mode, pass the selection through Spec 2's confirmation step. In open/check mode the Engine decides correctness; practice mode compares against `local.flagged` and consumes shared feedback/reveal behavior.

Every part control has an accessible name based on its role and text, communicates pressed/selected state, supports keyboard activation and retains visible focus. A polite status announces selection count and unmet minimum. Ensure document content remains readable at the active density and that selection styling is not conveyed by color alone. Respect reduced motion; interaction stops speech through the core lifecycle.

## Safety boundary

All sample names, organizations, URLs and brands are invented. Use only reserved `.example` hostnames. Links and buttons are inert display content, never anchors to live websites and never prompt for or transmit credentials. Images must be approved local assets with safe alt text.

## Testing strategy

- Schema tests: all kinds/roles accepted; 3 and 8 parts accepted; 2 and 9 rejected; duplicate IDs, invalid roles and out-of-range `minMarks` rejected; default minimum is 1.
- Renderer tests: role-specific parts display, selecting toggles state, Done threshold, explicit empty response when minimum is zero, no submission on selection.
- Mode tests: open/check submit to Engine; check uses shared confirmation; practice uses transformed flagged IDs and shared feedback.
- Accessibility/safety tests: keyboard controls, selected state announcements, contrast/state cue, inert links/buttons and no non-example external domains in fixtures.
- Property: for any selected subset of part IDs, the submitted answer is exactly that subset in deterministic document order, and only explicit Done or the empty-response action submits.

## Cross-spec reuse

Use shared contracts from player-core and choices-hotspots. Do not introduce a second mode classifier, feedback ladder, confirmation component or answer transport.
