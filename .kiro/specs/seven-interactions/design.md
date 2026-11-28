# Spec 7: Design

## Contract placement

The existing Engine returns one Step containing one node and at most one interaction. Extend the authored YAML, JSON Schema, Zod story schema, runtime node union and Answer union together. Spec 2's mode classifier, feedback ladder and check confirmation remain the single implementation for all seven types. Continue and Back remain navigation.

The following are contract shapes to refine during implementation, not permission to place private check answers in a rendered Step:

| Type | Rendered prompt | Child answer | Practice-only local data |
|---|---|---|---|
| pattern | 3–4 pad IDs/labels/visuals and a 3–5 step replayable demonstration | ordered pad IDs | expected sequence and feedback |
| keypad | digit limit, optional fictional Call label; practice may show a reference | digit string | expected value and feedback |
| count | prompt plus bounded candidate region IDs/geometry/accessible labels | selected region IDs | correct IDs and feedback |

The Engine supplies display order and progression. It holds check judgment. The player reports stable IDs or bounded digits and never branches on profile identity. Do not emit raw keypad values or child answers in product telemetry.

## Pattern stimulus and answer boundary

A repeat-the-pattern check necessarily displays the pattern to remember. The demonstration is public stimulus, even though it lets an observer infer the expected input. The node must not also carry a hidden `answer`, `local.expected` or equivalent check value. If a future check requires an undisclosed sequence, author a different prompt and keep its expected value in the Engine.

## Count candidate boundary

Render all authored candidate regions uniformly. The set of correct targets belongs only to the practice-local contract or the Engine for checks. A selected region is highlighted as selected, never as correct/incorrect before a check submission. Region IDs must be stable across retries and resumption.

## Enablement

`interactions.enabled` gates each type at validation and runtime. Unknown or disabled content produces the shared `unsupported` outcome. Enable one type at a time only after its full acceptance suite passes. Existing stories and the four core interactions keep their behavior.

## Accessibility and lifecycle

Use visible labels, focus rings, announced selection and completion state, minimum age-density targets, and non-audio cues. Pattern replay and keypad correction are keyboard-operable. No interaction starts a real call or navigation. No timer, animation or audio completion submits an answer. Cancel media and pending work on node change or unmount.

## Integration

Extend [the content format](../../../docs/content-format.md) and [technical specification](../../../docs/tech-spec.md) with final field definitions alongside the schema implementation. Test one fixture per type in open, practice and check mode, then run a second-host contract check through Spec 6 before claiming portable seven-type support.
