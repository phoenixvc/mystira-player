# Mystira Player PRD

| | |
|---|---|
| Status | v0.8, final, issued to the team |
| Date | 24 November 2026 |
| Entrant | Mystira (Pty) Ltd |
| Contest | Kiroween 2026, category: Costume Contest |
| Submission deadline | Friday 4 December 2026, 14:00 PT (midnight going into Saturday, South African time) |
| Companion docs | [Technical Specification](./tech-spec.md) v1.5, [Content format](./content-format.md) v1.1 |

> This repository is public and open source. This document describes only the player and its demo content. How Mystira decides what a child gets (story engine, personalisation rules, scoring and child-profile logic) runs in private services; it is out of scope here and is not described.

## TL;DR

Mystira Player is an open-source web player for choice-based, narrated interactive content: stories, lessons and assessments, for children across all of Mystira's age groups. It renders scenes, dialogue, media, overlays and four kinds of interaction (choices, tap-the-picture, put-in-order and inspect-a-message), and it runs checks with a research flow after a wrong answer. It runs standalone or embedded in another app. Every decision (what comes next, how a piece is taught to this child, whether an answer is right) is made by an engine; for lessons and checks that engine is a server. The player renders what it is given and reports what the child did.

Lessons and Assessments are the first new capability built on it, not its only purpose.

For Kiroween the entry is **The Manor of Major Headaches**: a friendly-spooky haunted manor where each locked door hides a puzzle, and solving it earns a key. Behind the doors are Mystira lessons. Two invented children enter the same manor, meet the same lesson and take the same check, but each child is taught each piece in a different way. The entry targets the Early School age group (6 to 9), with nine-year-olds in mind.

## Background

Mystira is a character-education platform where children learn through branching interactive stories. Choices in those stories build a record of how each child tends to approach things. Mystira is adding Lessons and Assessments that use that record to set the form of the teaching, never the content or the check: every child learns the same facts and answers the same questions.

Mystira's current child-facing app is built in Blazor, and the lesson prototypes so far are hand-built single-file pages. This player replaces both with one shared, data-driven component, built new and in the open with Kiro. Afterwards it will be embedded in the Mystira app, starting with an existing story preview and then Lessons and Assessments.

## Goals

### Contest goals

1. Submit a working, publicly deployable entry by the deadline that meets the Kiroween rules: new project, public repository with an open source licence, `/.kiro` folder included, demo video, and a live URL with judge access.
2. Score well on the five judging criteria: impact, use of Kiro, design, idea and video (see Success Criteria).

### Product goals

3. Produce a player that other apps can host without changes to the player: as a React component, or as a custom element inside a non-React app. A second host only supplies an engine, a theme and its own page chrome.
4. Make the player the first child-facing Mystira surface that is not built in Blazor.
5. Keep the player content-agnostic: lessons and stories are data for the player, with no lesson-specific code.
6. One content format: the player reads Mystira's own story YAML, extended to version 2.1 for lessons in a backwards-compatible way, so every existing Mystira story plays unchanged and lesson content can later be loaded into Mystira as it is.

### Scope rule

The number of demo children and the length of the lesson cost little. Each kind of interaction costs real work. So the entry keeps to four core interaction types; anything else is a stretch goal, built only once the core is done.

## Non-goals

- Any story generation, personalisation rules, scoring logic or child-profile logic in this repository.
- Real children's data or records, in any form. Demo children are invented.
- Any administrative or content-configuration UI.
- Calls to any service other than the Mystira API and Mystira Identity.
- Accounts or sign-up flows of its own.
- A lesson catalogue, schedule, journey timeline or progress history. (The demo's day switcher is a judging aid, not a schedule.)
- Content for the Teen and Adult age groups in the contest entry.
- Native mobile apps. The player is a responsive web app.

## Users

| User | Description | What they need from the player |
|---|---|---|
| Child (all Mystira age groups; the entry targets 6 to 9) | Ranges from pre-readers who tap and listen to confident readers. The youngest group sets the design floor. | Clear targets, narration available everywhere, no dead ends, age-appropriate content. |
| Grown-up | Signs in and picks which child's profile is playing. | A quick sign-in, an obvious profile picker, and a plain explanation of why the lesson looks the way it does. |
| Judge / developer | Evaluates or runs the project. | A live URL, a way to compare the two demo children side by side, and a local mode that runs from the repo alone. |

## User stories

- As a grown-up, I sign in once and choose which child's profile is playing.
- As a child, I enter the manor and choose which door to try, or follow the order I'm given, depending on how my lesson is set.
- As a child, I hear every line read aloud, by the character who says it, and I can hear it again.
- As a child, I learn by doing: choosing, tapping parts of a picture, putting steps in order or checking a message for tricks.
- As a child practising, when I get it wrong I get a gentle nudge, and after a few tries I'm shown where to look, but I still make the last tap myself.
- As a child, I never have to wait for the voice to finish before I can tap.
- As a child taking a check, I answer the same questions as every other child, with no timer. I choose, then tap "That's my answer", so a slip of the finger doesn't count against me. My first answer is the one that counts.
- As a child who gets an answer wrong, I am shown how to find the answer for myself: where to look, finding it there and checking it, before I answer again.
- As a child who solves a door, I earn its key.
- As a grown-up or judge, I can open a notes panel that says, in plain words, which parts are the same for every child and why a part was taught this way for this child.
- As a judge, I can switch between the two demo children and between the lesson and the check.
- As a developer, I can clone the repo and run the whole demo locally with no secrets or backend.

## Functional requirements

Priorities: **P0** required for submission, **P1** strongly wanted, **P2** only if time allows.

### Entry and the manor

| ID | Requirement | Priority |
|---|---|---|
| PR-01 | The grown-up signs in through Mystira Identity. No player-owned accounts. | P0 |
| PR-02 | After sign-in, show the account's child profiles as a profile picker. With one profile, skip the picker. Lessons and checks always run for exactly one profile. | P0 |
| PR-03 | The home screen can be a themed hub: a picture with doors as tap regions. Each door shows its state (locked, open, solved) by shape and icon as well as colour, and is announced in narration. | P0 |
| PR-04 | A door the engine marks as "check waiting" shows a pending indicator that uses shape and motion as well as colour. | P0 |
| PR-05 | A "switch profile" control is always reachable from the hub. | P0 |
| PR-06 | A local mode runs the bundled demo with no sign-in and no network calls. | P0 |
| PR-07 | The player can be embedded in another app as a custom element that takes its engine from the host, never changes the host's URL, and isolates its styles. | P0 |
| PR-08 | Solving a door awards its key, shown on a key ring on the hub. | P1 |

### Teaching

| ID | Requirement | Priority |
|---|---|---|
| PR-10 | Render a scene: background image or video, up to three characters, dialogue lines with the speaker shown, overlays and an interaction. | P0 |
| PR-11 | Narrate every line. Use recorded audio where the content provides it; otherwise use the browser's speech synthesis, with a per-character voice (pitch and rate). Content for the Toddler (1-2) and Preschool (3-5) groups must ship recorded audio; that rule is enforced where content is authored. Interactions stay usable while a line is spoken; a tap stops the speech. | P0 |
| PR-12 | Audio starts only after a user gesture (a "Start" tap standalone, or the host's gesture when embedded). | P0 |
| PR-13 | Render positioned text overlays on a scene, readable on any background and scaled to the viewport. | P0 |
| PR-14 | Core interactions: **choices** (2 to 4 buttons, with optional pictures); **hotspots** (find the right part of a picture; the regions are invisible, and a tap on nothing says "Nothing here" without counting as a wrong try); **sequence** (put 3 to 5 items in order, with Undo and Done; never submitted automatically); **inspect** (a mock message, page or sign whose parts the child marks to show what gives it away). | P0; inspect is the first core type to cut |
| PR-14a | Stretch interactions, built only once the core is done, in this order: **pattern** (watch and repeat a short sequence of lit, labelled pads), **keypad** (enter a short number; "Call" is pretend), **count** (find every one of several things in a picture). | P2 |
| PR-15 | In practice pieces the player gives instant feedback from data the engine sends with the piece: a wrong try plays the piece's next hint (or "Not yet. Try again.") with a gentle shake and a low tone, never a red cross. After three wrong tries (or the piece's own number) the right target pulses, and the child still taps it. | P0 |
| PR-16 | Show progress through a lesson in a simple, non-numeric way. | P1 |
| PR-17 | Preload the assets of likely next nodes when the engine provides hints. | P2 |
| PR-18 | Adapt presentation density to the content's target age group. | P1 |
| PR-19 | Support "the child goes back" when the engine allows it for this lesson. | P1 |

### Checks and research

| ID | Requirement | Priority |
|---|---|---|
| PR-20 | A check question uses any interaction from PR-14 and is narrated. No timer. | P0 |
| PR-21 | On a check the child selects an answer, then taps "That's my answer". Check answers are submitted whole to the engine. Check questions never carry their answer to the player, and give no feedback before the first answer. | P0 |
| PR-22 | Mark the first try as the one that counts, and say so on screen ("Only the first try counts"). | P0 |
| PR-23 | After a wrong answer, play the research steps the engine sends: where to look, finding it, checking it. The child's first answer can be shown next to what they found. | P0 |
| PR-24 | After research, the child answers again; that try is marked "not scored". | P0 |
| PR-25 | Leaving a check and coming back resumes it at the same question. Leaving reveals no answers. | P0 |
| PR-26 | Show an end screen with the score as "right on the first try: n of m". | P0 |

### Explanation and demo controls

| ID | Requirement | Priority |
|---|---|---|
| PR-27 | A notes panel, off by default, shows for the current step whether it is "the same for every child" or "different for each child", and the engine's plain-language reason. The reason may describe the child, so the panel is available only in demo mode or to the signed-in grown-up, never to a child playing alone. The player never computes or invents reasons. | P0 |
| PR-28 | In demo mode only, a control switches between the two demo children and between lesson, Day 3 check and Day 5 check, keeping the current step where possible. | P0 |

### Themes and presentation

| ID | Requirement | Priority |
|---|---|---|
| PR-30 | All colours, fonts, radii, motion and decorative assets come from a theme. Themes swap without code changes. | P0 |
| PR-31 | Ship the Manor theme: warm-lit haunted house, friendly ghosts and pumpkins, playful "headache" humour. Spooky but never scary: no jump scares, no gore, no threatening faces. | P0 |
| PR-32 | Ship neutral Mystira light, dark and bright themes that a host can override. | P1 |
| PR-33 | Honour `prefers-reduced-motion`. | P0 |
| PR-34 | Tapping a character on screen plays a short reaction (a jump, a startle, a wave) where the content allows it. Playful only: never a jump scare. | P2 |

### Reliability

| ID | Requirement | Priority |
|---|---|---|
| PR-40 | Network failures show a friendly, narrated "let's try that again" screen with a retry button. | P0 |
| PR-41 | A repeated tap or retried request never records an answer twice. | P0 |

## User experience

### Core flow (contest demo)

1. Judge opens the live URL. Local mode starts at once; signed-in mode shows the profile picker.
2. The manor's front hall: a picture with five doors. One door is open (the Pumpkin Gate); a second may be open (the Fire Door); the rest are locked with "coming soon" plaques.
3. The child enters the Pumpkin Gate. The lesson plays: five pieces, each taught in the way set for this child, with characters speaking their lines.
4. The judge switches to the other child and sees the same pieces taught differently. The notes panel explains each difference.
5. The Day 3 check: the same questions for both children. A wrong first answer leads into research, then a second, unscored try.
6. The door is solved and the key is added to the ring.

### Demo content

| Door | Lesson | Status |
|---|---|---|
| The Pumpkin Gate: one pumpkin always lies, one always tells the truth | How do you know something is true? (who said it, how do they know, what do they want, who else says it, ask a grown-up) | Built in full |
| The Fire Door | Fire safety: get low, feel the door, meet at the meeting spot, the number to call | Stretch: the current fire safety lesson is written for 3 to 5 year olds and its "call the number" piece needs the keypad, so it needs rewording for 6 to 9 and a choices version of that piece |
| The Candy Vault: share the trick-or-treat haul fairly | Fractions: is it fair? | Locked, "coming soon" |
| The Shaking Stairs, the Rising Water | Earthquake and flood safety | Locked, "coming soon" |

The two demo children are invented. Each has a short, hand-written strengths summary used only to explain the demo. Their lessons are pre-set in the demo content; the player does not work them out.

How the Pumpkin Gate uses the four interactions:

| Piece | Lerato | Daan |
|---|---|---|
| Who said it? | choices (same for both) | choices (same for both) |
| How do they know? | hotspots: tap who actually saw it | sequence: teach the three ways of knowing in order |
| What do they want? | inspect: a "free coins" message (same for both) | inspect (same for both) |
| Who else says it? / Ask a grown-up | choices, set per child in the content | choices, set per child in the content |
| Day 3 and Day 5 checks | choices, plus one inspect question on Day 5 | the same questions |

No real child's name, record or answers appear anywhere in the demo, and the axis codes used in Mystira's internal prototypes stay out of the repository.

All demo text, pictures and audio in this repository are public under the repository licence.

### Design principles

- Everything can be heard. Each character has a recognisable voice.
- One decision per screen.
- No timers, no failure sounds, no lost progress.
- A wrong answer leads to finding out, never to a bare hint.
- Friendly-spooky: dark palette with warm light, rounded shapes, characters who are clearly kind, jokes over frights.
- Contrast: text meets WCAG 2.2 AA against its backing; overlays always sit on a backing plate.

## Success criteria

### Judging criteria mapping

| Criterion | How the entry earns it |
|---|---|
| Impact | Every child learns the same facts and takes the same check, but is taught in the way that fits them; a mistake becomes a lesson in finding things out. |
| Use of Kiro | Spec-first build in Kiro: steering files, four specs generated from these docs (the core plus one per interaction group), agent hooks that validate content and contrast, documented in the write-up. |
| Design | A polished Manor theme on a real theme system; narrated, accessible, reduced-motion-aware UI. |
| Idea | An open player paired with a private engine; one manor, one lesson, two children, two ways in. |
| Video | Under three minutes: the manor, the same piece taught two ways side by side, a wrong answer turning into research, a glimpse of Kiro specs and hooks. |

### Release checklist

- [ ] One Devpost project, with both team members on it.
- [ ] Public repository with licence file, README, run instructions and `/.kiro` folder.
- [ ] Local mode runs from a fresh clone with `npm install` and `npm run dev`.
- [ ] Live deployment, reachable and free to use until at least 29 January 2027.
- [ ] Judge access: the local demo on the live URL, and a test account if signed-in mode is shown.
- [ ] Demo video on YouTube.
- [ ] Submission text discloses the pre-existing private services the player can call.
- [ ] No real children's data, names or records anywhere in the repository, video or submission.
- [ ] All P0 requirements pass their acceptance tests.

## Scope cut order

If time runs short, cut in this order, top first:

1. The Fire Door (keep it locked) and all stretch interactions (never started).
2. PR-17 preloading, PR-32 neutral themes (keep one), PR-18 density.
3. PR-08 key ring, PR-16 progress.
4. Inspect: the "what do they want" piece falls back to choices.
5. Signed-in mode (submit with local mode only).

Never cut: the Pumpkin Gate lesson for both children, the check with research, the notes panel or the Manor theme.

## Milestones

| Date | Milestone |
|---|---|
| Tue 24 Nov | Eligibility question sent (done). Both team members registered on Devpost, one Devpost project with both members, Kiro credit requests in (Yolandi's done). Repo created. Kiro steering and specs generated from these docs. |
| Wed 25 to Thu 26 Nov | Content format final (done 24 Nov: Mystira story YAML 2.1; full Pumpkin Gate skeleton validated). Node schema, engine interface, local engine compiling story YAML, scene renderer, dialogue and narration with speech fallback. |
| Fri 27 to Sat 28 Nov | Interactions: choices and hotspots, then sequence, then inspect, all three modes and the feedback ladder. Custom element wrapper. |
| Sun 29 to Mon 30 Nov | Pumpkin Gate content as data for both children; check, research flow and notes panel. Go or no-go on the Fire Door. |
| Tue 1 Dec | Manor hub and theme; demo controls; first embedding in a second host. |
| Wed 2 Dec | Polish, accessibility pass, deploy. |
| Thu 3 Dec | Video, README, Kiro write-up. Submit. |
| Fri 4 Dec | Buffer only. |

## Open questions

1. **Eligibility.** Does a new player that can call pre-existing private services count as a new project? Asked on 24 Nov; the hackathon manager is away until 30 Nov, so the question also went to Devpost support. Building does not wait for the answer: local mode keeps the repo self-contained either way.
2. **Licence.** Apache-2.0 (explicit patent grant) or MIT. Recommendation: Apache-2.0.
3. **Assets.** Who owns the Manor art and puzzles, and may they be released publicly under the repository licence? Images generated with an AI tool need their terms checked.
4. **Voices.** Speech synthesis only for the entry, or recorded voices for the main characters?
5. **Locale.** English only, or also Afrikaans to show localisation?
