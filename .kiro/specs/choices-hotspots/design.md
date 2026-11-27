# Design Document: choices-hotspots

## Overview

Spec 2 adds choice and hotspot interactions and defines shared practice/check behavior for all four interaction specs. Core Engine interfaces, generic session protocol and shared scene presentation remain authoritative in player-core.

## Ownership and traceability

This spec owns the check-node refinements migrated from player-core Requirements 2.2–2.3; assessment/research/result compilation from Requirements 5.5–5.7; check-specific navigation and scoring from Requirements 8.5–8.6; task omission from Requirement 11.3; and shared mode/check confirmation from Requirements 13–15.

### Check schema invariants

Apply check refinements to the completed node union so they run after discriminated-union parsing. Reject local or task on check nodes, reject reveal on hotspot spots in checks, and reject attempt 2 with scored true. Cover each invalid invariant with validator tests. Do not use omit where it would silently strip invalid content.

## Choice and hotspot rendering

Choice and hotspot components consume typed runtime nodes and submit stable IDs using the core Engine respond contract. Both are gated by config interactions.enabled. Components use the shared mode classifier; correctness stays in the Engine in open and check modes. In practice, the local block supports deterministic feedback. Hotspot practice must not mark a wrong location with an explicit miss indicator.

## Assessment/research/result compilation

**Assessment Requirement 5.5 — check scene → check node**:

```typescript
function compileCheckScene(
  scene: SceneYaml,
  story: StoryYaml,
  checkAnswers: Map<string, CheckAnswer>,
): Node {
  // Check answers are kept in the engine, never on the node (Requirement 7.1)
  const interaction = buildInteraction(scene);
  // Requirement 2.2: check nodes must not carry local, task, or reveal
  // The interaction must not have a local block:
  if ("local" in interaction) {
    delete (interaction as any).local;
  }

  return {
    type: "check",
    id: scene.id,
    title: scene.title,
    question: buildNarration({ text: scene.description }),
    interaction,
    attempt: 1,         // Requirement 5.5
    scored: true,
    media: buildMedia(scene),
    characters: buildCharacters(scene, story),
    speakers: buildSpeakers(scene, story),
    lines: buildLines(scene),
    overlays: buildOverlays(scene),
    // task is omitted (check nodes never have task)
    music: scene.music ? { profile: scene.music.profile } : undefined,
    rationale: undefined,
    autoAdvance: scene.auto_advance ?? false,
  };
}
```

**Migrated Requirement 5.6 — research scene → research node**:

```typescript
function compileResearchScene(scene: SceneYaml, story: StoryYaml): Node {
  return {
    type: "research",
    step: scene.research!.step,
    source: scene.research!.source,
    yourAnswer: undefined,  // filled in by engine after a wrong check answer
    interaction: buildInteraction(scene),
    // ... SceneBase fields (same as compileScene)
  };
}
```

**Migrated Requirement 5.7 — `lesson.result` → result node**:

```typescript
function compileResultScene(scene: SceneYaml, result: LessonYaml["result"]): Node {
  return {
    type: "result",
    correctFirstTry: 0,  // filled by engine from check results
    total: 0,            // filled by engine
    key: result?.key ? {
      label: result.key.label,
      iconUrl: result.key.image ?? "",
    } : undefined,
    interaction: { type: "continue" },
    // ... SceneBase fields
  };
}
```

#### `demo-block.ts` — Per-child version selection (Requirement 6)

```typescript
interface DemoSelection {
  profileId: string;
  // pieceId → versionId (for versioned pieces)
  versions: Map<string, string>;
  // ordered list of entry scene ids (one per piece, in the chosen order)
  order: string[];
  // pieceId → rationale (from demo block)
  rationales: Map<string, Rationale>;
}

function selectFromDemoBlock(story: StoryYaml, profileId?: string): DemoSelection {
  const demo = story.demo;
  const lesson = story.lesson;
  if (!demo || !lesson || !profileId) {
    // No demo block: all pieces in lesson order, no per-child versions
    return defaultSelection(story);
  }

  const profile = demo.profiles.find(p => p.id === profileId);
  if (!profile) return defaultSelection(story);

  // Requirement 6.1: read demo block for version and order
  const versions = new Map<string, string>(Object.entries(profile.versions ?? {}));

  // Requirement 6.3/6.4: order
  const pieces = lesson.pieces;
  let orderedPieceIds: string[];
  if (profile.order === "child_chooses") {
    // Requirement 6.4: child chooses order
    // The engine presents pieces in lesson order; the child's choices
    // determine the actual order at runtime (via choices interaction).
    // For this spec (continue only), we present in lesson order and
    // the child_chooses flag is stored for later specs.
    orderedPieceIds = pieces.map(p => p.id);
  } else {
    // Requirement 6.3: fixed → lesson order
    orderedPieceIds = pieces.map(p => p.id);
  }

  // Build entry scene for each piece (using the selected version)
  const order: string[] = [];
  const rationales = new Map<string, Rationale>();
  for (const pieceId of orderedPieceIds) {
    const piece = pieces.find(p => p.id === pieceId)!;
    let sceneId: string;
    if (piece.versions) {
      // Requirement 6.2: compile the version named for this profile
      const versionId = versions.get(pieceId);
      const version = piece.versions.find(v => v.id === versionId)
        ?? piece.versions[0];
      sceneId = version.scenes[0];
    } else {
      sceneId = piece.scenes![0];
    }
    order.push(sceneId);

    // Requirement 6.5: take rationale from demo block
    const rationaleText = profile.rationale?.[pieceId];
    if (rationaleText) {
      rationales.set(sceneId, {
        differs: piece.versions !== undefined,
        text: rationaleText,
      });
    }
  }

  return { profileId, versions, order, rationales };
}
```

The compiler attaches the rationale to each compiled node:

```typescript
// In compileStory, after compiling each scene:
const rationale = demoSelection.rationales.get(scene.id);
if (rationale) {
  node.rationale = rationale;
}
```

**Requirement 6.6**: No component branches on child identity. The `DemoSelection` is resolved entirely within `LocalEngine`. The renderer only sees the `Node` (with its `rationale` field) and the `Step`. There is no `childId` or profile reference in any component.

#### `session.ts` — Session state and control (Requirement 8)

```typescript
interface Session {
  sessionId: string;
  version: string;
  compiled: CompiledStory;
  current: string;              // current node id
  history: string[];            // node ids for back navigation
  processedRequests: Map<string, Step>;  // answerRequestId → Step
}

// Derived on demand so it cannot drift from the history or the current node (Requirements 8.3 to 8.5).
function canGoBack(session: Session): boolean {
  const current = session.compiled.nodes.get(session.current);
  return session.history.length > 0 && current?.type !== "check";
}
```

**Requirement 8.1 (idempotency)**: Before processing a `respond` call, check if `answerRequestId` is in `processedRequests`. If so, return the stored `Step` without re-processing.

**Requirement 8.2 (stale version)**: Compare `r.version` with `session.version`. If they differ, throw `EngineError { kind: "conflict", currentStep: this.buildStep(session) }`.

**Requirement 8.3/8.4 (canGoBack)**: `canGoBack(session)` is true when `session.history.length > 0` and the current node is not a check. `back` answers are rejected (throw conflict) when `canGoBack` is false.

**Requirement 8.5**: `canGoBack` is always false on check nodes.

**Requirement 8.6**: When a check is at `attempt: 2`, the engine produces a check node with `scored: false`. The `attempt` field on the node tells the renderer to show "This try does not count for the score".

#### Answer extraction and stripping (Requirement 7)

```typescript
// Extract check answers from lesson block (engine-only, never on nodes)
function extractCheckAnswers(story: StoryYaml): Map<string, CheckAnswer> {
  const answers = new Map<string, CheckAnswer>();
  for (const check of story.lesson?.checks ?? []) {
    for (const q of check.questions) {
      answers.set(q.scene, {
        answer: q.answer,
        research: q.research ?? [],
      });
    }
  }
  return answers;
}

// Requirement 7.3: build local block from practice
function buildLocalBlock(practice: PracticeYaml): object | undefined {
  if (!practice) return undefined;
  // Transform practice.answer into the interaction's local block
  // The content 'answer' field is NOT copied; it is transformed:
  //   answer.branch → correctId
  //   answer.object → correctId
  //   answer.order  → order
  //   answer.parts  → flagged
  return {
    correctId: practice.answer.branch ?? practice.answer.object,
    order: practice.answer.order,
    flagged: practice.answer.parts,
    feedback: {
      hint: buildNarration(practice.hint),
      onWrong: practice.on_wrong?.map(buildNarration),
      revealAfter: practice.reveal_after ?? 3,
    },
  };
}

// Requirement 7.1: strip every answer
// The compileScene/compileCheckScene functions never copy the raw
// 'answer' field from practice or lesson.checks onto the node.
// The local block is a transformed representation (correctId, order, flagged),
// not the raw answer object.

// Requirement 7.2: invariant assertion
function assertNoAnswerOnNode(node: Node): void {
  // Check that no field named 'answer' exists on the node or its interaction
  const nodeAny = node as unknown as Record<string, unknown>;
  if ("answer" in nodeAny) {
    throw new Error(`Node ${node.id} carries an answer field`);
  }
  const interaction = nodeAny.interaction as Record<string, unknown> | undefined;
  if (interaction && "answer" in interaction) {
    throw new Error(`Node ${node.id} interaction carries an answer field`);
  }
  // Check nodes must not have local blocks:
  if (node.type === "check" && interaction && "local" in interaction) {
    throw new Error(`Check node ${node.id} carries a local block`);
  }
}
```



## Shared mode machinery

### 6. Shared mode machinery (Requirements 13, 14, 15)

#### `modes.ts` — Classification (Requirement 13)

```typescript
export type Mode = "open" | "practice" | "check";

export function classifyMode(node: Node): Mode {
  // Requirement 13.3: check takes precedence
  if (node.type === "check") return "check";

  // Every non-check interaction follows the same local-block rule.
  // The Node Schema keeps raw check answers out of this block.
  const interaction = node.interaction as Record<string, unknown>;
  return "local" in interaction && interaction.local !== undefined ? "practice" : "open";
}
```

**Requirement 13.4 (totality)**: The function returns exactly one of `"open"`, `"practice"`, `"check"` for every node. The discriminated union on `node.type` and the `if/else` chain ensure totality.

#### `feedbackLadder.ts` — Practice feedback (Requirement 14)

```typescript
export interface FeedbackResult {
  message: Narration;     // the feedback message to play/show
  revealTarget: boolean;  // whether to reveal the correct answer
}

export function getFeedback(
  wrongTryNumber: number,        // 1-based
  wrongTryCount: number,          // total wrong tries so far (including this one)
  feedback: Feedback | undefined,
): FeedbackResult {
  // Requirement 14.1: onWrong[n-1] → hint → built-in "Not yet. Try again."
  let message: Narration;
  if (feedback?.onWrong && wrongTryNumber - 1 < feedback.onWrong.length) {
    message = feedback.onWrong[wrongTryNumber - 1];
  } else if (feedback?.hint) {
    message = feedback.hint;
  } else {
    message = { text: "Not yet. Try again." };
  }

  // Requirement 14.3: revealAfter wrong tries → reveal correct target
  const revealAfter = feedback?.revealAfter ?? 3;
  const revealTarget = wrongTryCount >= revealAfter;

  return { message, revealTarget };
}
```

- **Requirement 14.2**: The feedback is accompanied by a gentle shake (CSS animation) and a low tone (from `Tones`), never a red cross or failure sound.
- **Requirement 14.3**: When `revealAfter` wrong tries have occurred, the correct target pulses (CSS animation), and the child still makes the final tap.
- **Requirement 14.4**: When the child gives the correct answer, the mode logic accepts it and submits the final answer with `wrongTries` set to the count of wrong tries.

#### `usePracticeMode.ts` — Practice state hook

```typescript
function usePracticeMode(local: LocalBlock | undefined, mode: Mode) {
  const [wrongTries, setWrongTries] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const judge = useCallback((answer: Answer): { correct: boolean; feedback: FeedbackResult } => {
    if (mode !== "practice" || !local) {
      return { correct: true, feedback: { message: { text: "" }, revealTarget: false } };
    }
    const correct = checkAnswer(answer, local);
    if (correct) {
      return { correct: true, feedback: { message: { text: "" }, revealTarget: false } };
    }
    const newWrongTries = wrongTries + 1;
    setWrongTries(newWrongTries);
    const feedback = getFeedback(newWrongTries, newWrongTries, local.feedback);
    if (feedback.revealTarget) setRevealed(true);
    return { correct: false, feedback };
  }, [local, mode, wrongTries]);

  return { wrongTries, revealed, judge };
}
```

#### `CheckConfirmation.tsx` — "That's my answer" (Requirement 15)

```typescript
interface CheckConfirmationProps {
  node: CheckNode;
  onSubmit: (answer: Answer) => void;
  inFlight: boolean;
  // No retry identifier here: `onSubmit` carries only an Answer, so `useSession.respond`
  // owns the answerRequestId and reuses it on retry.
}
```

- **Requirement 15.1**: When `attempt === 1`, shows an "Only the first try counts" banner.
- **Requirement 15.2**: Requires the child to choose an answer, then tap "That's my answer" before submitting. An empty inspect selection is a valid answer when `minMarks` is zero; it is distinct from no answer yet.
- **Requirement 15.3**: While a submission is in flight (`inFlight === true`), the interaction is disabled.
- **Requirement 15.4**: On retry after an error, the same `answerRequestId` is reused (held by `useSession`, keyed by node id and version). The engine's idempotency check (Requirement 8.1) ensures the retry returns the original success result without re-scoring.

```typescript
function CheckConfirmation({ node, onSubmit, inFlight }: CheckConfirmationProps) {
  const [selected, setSelected] = useState<Answer | null>(null);
  // Interaction components call setSelected with a complete typed answer.
  // For inspect, { kind: 'inspect', partIds: [] } is a valid selection.

  // Requirement 15.1: attempt 1 banner
  {node.attempt === 1 && (
    <div className={styles.banner} role="status">
      Only the first try counts
    </div>
  )}
  {node.attempt === 2 && (
    <div className={styles.banner} role="status">
      This try does not count for the score
    </div>
  )}

  // Interaction rendering (choices, hotspots, etc.) — later specs
  // Check nodes are rendered with an enabled interaction component.

  // Requirement 15.2: selection + "That's my answer"
  <button
    disabled={selected === null || inFlight}   // Requirement 15.3
    onClick={() => { if (selected !== null) onSubmit(selected); }}
  >
    That's my answer
  </button>
}
```




## Correctness properties

### Property: Mode totality

For any valid runtime node, the shared mode classifier returns exactly one of `open`, `practice`, or `check`, deterministically. Validate across generated node types and local-block presence.

### Property: Answer-stripping invariant

For any supported story and profile, compiled runtime nodes never expose raw answer values from practice blocks or assessment answers. Practice may carry only the transformed local representation; assessment answers remain Engine-private.

### Property: Check-node invariants

For any generated check node, `local`, `task`, and forbidden hotspot `reveal` fields are rejected; attempt 2 cannot be scored; and `canGoBack` is false. Valid checks retain their Engine-private answer data and render the confirmation step.
## Cross-spec reuse

Sequence and inspect use the same mode classification, feedback ladder, answer submission and lifecycle conventions. Their interaction-specific placement/inspection behavior remains in their own specs. Do not introduce duplicate mode classifiers or check-confirmation implementations.
