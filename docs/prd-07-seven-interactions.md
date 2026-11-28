# PRD 07: Seven interaction types

| | |
|---|---|
| Status | Product target approved; implementation after the four core interaction gates |
| Decision | All seven interaction types belong in the supported Mystira Player, without making all seven a Kiroween submission requirement |
| Primary PRD | [Mystira Player PRD](./prd.md) |
| Technical spec | [Spec 7: seven interaction coverage](../.kiro/specs/seven-interactions/requirements.md) |

## Problem and outcome

Stories and lessons need more than choices, hotspots, sequence and inspect. Pattern, keypad and count let authors teach and check different kinds of tasks without building one-off player screens. The product decision is to support all seven as a player capability. The existing four-core cut order remains the current delivery gate; this PRD sets the next product target.

Success means a host can enable each of the seven types in open, practice and check mode, authored content validates, unsupported types fail clearly, and a child can complete each type with touch, pointer and keyboard. Support is proven by real player tests and a host acceptance run, not by a schema enum alone.

## Scope and sequencing

1. Complete and accept Specs 1�4: continue navigation plus choices, hotspots, sequence and inspect. Spec 2 owns the shared open/practice/check, feedback and assessment flow.
2. Add pattern, keypad and count in that order under Spec 7. Each type has an independent enablement and acceptance gate; a host may support four, five, six or seven types.
3. Use Spec 5 to prove legacy Mystira story playback and Spec 6 to prove third-party embedding. Their gates remain separate from interaction coverage.
4. The Kiroween scope and cut order in [the primary PRD](./prd.md) do not expand automatically. A release that promises seven types must pass all seven gates.

## Requirements

| ID | Requirement |
|---|---|
| P7-01 | The player supports choices, hotspots, sequence, inspect, pattern, keypad and count through one versioned Engine/node contract. Continue and Back are navigation, not interaction types. |
| P7-02 | Every enabled type works in open mode (Engine decides progression), practice mode (shared local feedback and reveal), and check mode (Engine decides correctness; first try counts and confirmation precedes submission). |
| P7-03 | Pattern presents three or four labelled pads with visual cues; a child can replay a demonstration, reproduce three to five steps, correct input before Done, and finish muted. Audio never carries the only cue. |
| P7-04 | Keypad accepts a bounded digit sequence with correction before Done. A displayed "Call" control is pretend and never starts a phone call, opens a URI or requests contact access. |
| P7-05 | Count asks the child to find and select multiple scene objects, shows progress without revealing correctness on a check, permits correction before Done, and submits stable selected IDs. |
| P7-06 | The Engine supplies prompts, candidate order and progression. The player does not infer a child's profile, choose a teaching method, score a check or invent an answer. |
| P7-07 | A type absent from `interactions.enabled` produces a clear unsupported state at validation and runtime. The player never silently substitutes another interaction. |
| P7-08 | Input, focus, selected state, feedback and completion are understandable without sound or colour, respect reduced motion and the age-density target, and do not trap a child when audio is unavailable. |
| P7-09 | Each type has schema, component, keyboard, accessibility and end-to-end coverage in open, practice and check modes. Check nodes contain no private answer field. |

## Content and safety boundaries

The authored story YAML remains the single source format. Spec 7 will extend the JSON and Zod schemas and [content format](./content-format.md) before content using the new types is published. Existing 2.1 stories remain valid. A question stimulus may necessarily show information a child is asked to repeat, such as a pattern demonstration; it is not a secret answer field. Production check judgment remains in the Engine. The public local demo uses fictional content and cannot promise secrecy for values bundled in its own files.

No real child records, private teaching-selection rules, diagnostic claims or external calling behavior belong in this repository. Spec 2 already owns the approved answer-specific wrong-choice feedback and optional changed image with an explanatory line after a correct practice choice. Its exact authoring shape remains under Spec 2 design review; this PRD does not broaden it.

## Acceptance

- All four core types have passed their existing specs before the first new type is enabled.
- Pattern, keypad and count each pass the requirements and verification plan in Spec 7.
- A content fixture for each new type parses, compiles and runs in all three modes; invalid or disabled content fails clearly.
- A child can complete each type with touch and keyboard, with audio unavailable and reduced motion enabled.
- A check requires explicit confirmation, submits a stable answer once, and never exposes a private answer field in the rendered step.
- A second host confirms the same enabled type behaves through the Engine contract before the seven-type product claim is made.
