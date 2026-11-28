# Spec 7: Seven interaction coverage

## Boundary

This spec adds pattern, keypad and count to the four interaction families in Specs 1–4. It follows [PRD 07](../../../docs/prd-07-seven-interactions.md). Spec 2 owns shared modes, feedback, check confirmation, research and answer submission. Spec 7 reuses those contracts. Specs 5 and 6 separately own legacy playback and portable embedding.

The three new types are a post-core product target. Jurie targeted keypad for the Kiroween fire-safety lesson on 2026-11-28, with a separately authored core-interaction fallback; keypad is not a submission blocker. Pattern and count remain after the contest minimum. No new type is enabled before all four core gates and its own acceptance gate pass.

The [design](design.md) places these requirements in the existing Engine and Player contracts, and the [task plan](tasks.md) begins with task 0: review current core acceptance evidence and freeze the first new type's authored and runtime contract. A target in this spec is not a claim that the current build supports it.

## Requirements

### S7-1: Versioned content and capability contract

1. Story YAML, JSON Schema and Zod SHALL define each new type with stable IDs, bounded values and descriptive validation errors.
2. Existing valid story YAML 2.1 SHALL remain valid.
3. The node and Answer unions SHALL represent each type; a disabled type SHALL return `unsupported` without fallback or silent auto-advance.
4. `interactions.enabled` SHALL enable each type separately. The player SHALL report its supported types to a host.

### S7-2: Pattern

1. Pattern SHALL present three or four pads, each with a stable ID, visible label and visual state; an optional tone supplements the visual cue.
2. The prompt demonstration SHALL have three to five pad steps and a replay control. The child SHALL enter a sequence, remove the last step and explicitly submit.
3. Muted playback and unavailable audio SHALL preserve the full task. Reduced motion SHALL preserve distinct shown, selected and completed states.
4. In practice, the shared feedback/reveal contract MAY use a transformed local expected sequence. In check, the Engine SHALL judge the submitted sequence; no private expected-sequence field SHALL be copied onto the rendered Step.
5. A demonstration that is itself the sequence to repeat is a visible question stimulus. Documentation and tests SHALL distinguish it from a private check answer field.

### S7-3: Keypad

1. Keypad SHALL accept digits only, with a content-defined maximum length within a bounded schema range, Backspace/Clear, and explicit Done.
2. The player SHALL never open `tel:`, navigate, call a device API, or request contacts. A "Call" label, if shown, is fictional task copy.
3. A practice reference MAY be displayed where content requests it. A check SHALL not include a reference or private expected value in its rendered Step.
4. The Engine SHALL judge open/check submissions. Practice SHALL use Spec 2's local feedback without logging raw digits as analytics.

### S7-4: Count

1. Count SHALL supply bounded candidate scene regions with stable IDs and an authored prompt identifying the kind of thing to find. Candidate regions SHALL not encode correctness by their public names or visual treatment.
2. The child SHALL select and deselect candidates, see a neutral selection tally, and explicitly submit selected IDs. Selection alone SHALL not reveal whether an item is correct on a check.
3. Practice MAY receive transformed local correct IDs for shared feedback/reveal. Check correctness SHALL remain Engine-owned and absent from the rendered Step.
4. Regions SHALL be operable by touch and keyboard with accessible names and focus treatment, without making the answer visually obvious.

### S7-5: Shared mode and lifecycle behavior

1. All three types SHALL use Spec 2's open, practice and check modes, first-try scoring rule, check confirmation, retry idempotency and unscored follow-up behavior.
2. Each type SHALL stop current speech on interaction, remain usable without audio, and never auto-submit because a demonstration, tone or video finishes.
3. On node change, unmount or retry, transient input and media SHALL clean up without submitting twice. Resume behavior SHALL use the Engine Step and version.

### S7-6: Verification and product claim

1. Each type SHALL have valid/invalid schema tests, mode and answer-shape tests, keyboard and accessible-state tests, reduced-motion and no-audio tests, and a realistic end-to-end fixture.
2. An independent host SHALL verify the Engine/capability contract before the player is described as supporting all seven across hosts.
3. Release notes SHALL list exactly which types are enabled and accepted. A schema definition or disabled component alone SHALL not count as supported.
