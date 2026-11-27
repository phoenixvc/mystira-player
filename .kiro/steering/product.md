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

- **The Pumpkin Gate** (built in full): "How do you know something is true?" Five pieces: who said it, how do they know, what do they want, who else says it, ask a grown-up. The lesson concludes with an assessment; a wrong first answer leads into research before an unscored retry.
- **The Fire Door**: stretch, only if the Pumpkin Gate is complete.
- The other doors stay locked with "coming soon".
- Audience: ages 6 to 9, written for nine-year-olds.
- Two invented children, **Lerato** and **Daan**, see the same pieces taught differently. The notes panel explains why.

## Scope rule

Each interaction type is real work; story length and the number of children cost little.

- **Core four:** choices, hotspots (tap the picture), sequence (put in order), inspect (mark parts of a message).
- **Stretch:** pattern, keypad, count. Never start one before the core four pass their tests.
- **Cut order** when time is short: Fire Door and stretch types first; then preloading, extra themes, density; then key ring and progress; then inspect (its piece falls back to choices); then signed-in mode.
- **Never cut:** the Pumpkin Gate for both children, the check with research, the notes panel, the Manor theme.

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
