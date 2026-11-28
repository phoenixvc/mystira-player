---
inclusion: always
---

# Product: Mystira Player

Full detail: `docs/prd.md`. This file is the part you must hold in mind on every task.

## What it is

An open-source web player for choice-based, narrated interactive content: stories, lessons and assessments, for every Mystira age group. It renders scenes, dialogue, media, overlays and interactions, and reports what the child did. **An engine makes every decision**: what comes next, which way a piece is taught to this child, whether an answer is right. The player never decides these.

It ships as a standalone SPA and as an embeddable `<mystira-player>` custom element (plus a React component export).

## The Kiroween entry

"The Manor of Major Headaches": a friendly-spooky front hall with five doors. Each door is a lesson; solving it earns a key.

- **The Fire Door** is the minimum submission lesson: fire safety for ages 6 to 9. A mummy hosts a party, a witch visits from her potion house, a ghost is present, and the child helps make the party safe. The full plot, teaching pieces, common check and media placement await content approval. Media production is underway; production does not imply approval.
- **The Pumpkin Gate** is the second lesson target: "How do you know something is true?" Its validated content skeleton is available, but it does not replace the fire-safety minimum.
- The other doors stay locked with "coming soon".
- Audience: ages 6 to 9, written for nine-year-olds.
- The two demo children are invented. Reviewed method variants may differ, while the fire-safety facts, support, pace, piece order and common check remain the same. The notes panel explains the selected method.

## Scope rule

Each interaction type is real work; story length and the number of children cost little.

- **Core four:** choices, hotspots (tap the picture), sequence (put in order), inspect (mark parts of a message).
- **Post-core product target:** keypad, pattern and count complete the seven-type player under [PRD 07](../../docs/prd-07-seven-interactions.md) and Spec 7. Keypad is targeted for Kiroween after the core gates pass, with an authored core-interaction fallback; it does not block submission.
- **Contest cut order** when time is short: Pumpkin Gate second lesson and unfinished Spec 7 interactions first. The Fire Door retains its authored core-interaction path. Then preloading, extra themes, density; key ring and progress; inspect if an approved lesson can use a core fallback; signed-in mode.
- **Never cut:** the reviewed Fire Door fire-safety lesson, its common check with research, the notes panel, or the Manor theme. Unapproved content must not be presented as ready.

## Design principles

- Everything can be heard; each character has a recognisable voice.
- One decision per screen.
- No timers, no failure sounds, no lost progress.
- A wrong answer leads to finding out, never to a bare hint.
- Friendly-spooky: dark palette, warm light, rounded shapes, kind characters, jokes over frights.
- Text meets WCAG 2.2 AA; overlays always sit on a backing plate.

## Hard limits (public repository)

- No personalisation rules, scoring logic, story generation or child-profile logic in this repo.
- No real children's data, names, records or answers, anywhere. Demo children are invented.
- No Mystira internal axis codes or names.
- No calls to any service other than the Mystira player API and Mystira Identity.
- No secrets in code or config.
