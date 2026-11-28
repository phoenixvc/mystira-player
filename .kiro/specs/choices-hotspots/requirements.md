# Requirements Document: choices-hotspots

## Introduction

This is Spec 2 of four for Mystira Player. It adds choice and hotspot interactions and owns shared open/practice/check behavior, practice feedback and reveal, check confirmation, and the assessment/research/result flow. Specs 3 (sequence) and 4 (inspect) reuse these shared rules.

Core contracts and renderer foundations are defined by player-core. This spec does not redefine the Engine boundary, generic session idempotency, the story YAML 2.1 format, or shared scene presentation.

## Requirements

### Requirement CH1: Choice interactions

**User Story:** As a child, I want to answer story choices clearly, so that I can keep playing the story.

#### Acceptance Criteria

1. The Node Schema SHALL accept choices with stable choice IDs and labels from the Story YAML contract.
2. WHEN choices are enabled in config, THE Player SHALL render each choice as an accessible, keyboard-operable control.
3. WHEN a choice answer is submitted under the shared mode and check-confirmation rules, THE Player SHALL send its stable choice ID through the Engine interface.
4. WHERE a choice carries a practice-local block, THE Player SHALL apply the shared practice rules in CH4.
5. WHERE a choice has no local block, THE Player SHALL accept selection as open mode and leave correctness to the Engine.

### Requirement CH2: Hotspot interactions

**User Story:** As a child, I want to tap an object in the scene, so that I can explore or answer using the picture.

#### Acceptance Criteria

1. The Node Schema SHALL accept hotspots with stable object IDs, labels and authored positions.
2. WHEN hotspots are enabled in config, THE Player SHALL render accessible hit targets at their authored positions.
3. WHEN a hotspot answer is submitted under the shared mode and check-confirmation rules, THE Player SHALL send its stable object ID through the Engine interface.
4. WHERE a hotspot carries a practice-local block, THE Player SHALL apply the shared practice rules in CH4.
5. WHERE a hotspot has no local block, THE Player SHALL accept selection as open mode and leave correctness to the Engine.
6. A wrong hotspot answer in practice mode SHALL use shared feedback; the Player SHALL NOT display a miss marker that reveals whether a location was incorrect.

### Requirement CH3: Assessment, research and result nodes

**User Story:** As a child, I want an assessment followed by relevant research and a result, so that I can try, learn and see what happened.

**Source trace:** migrated from player-core Requirements 2.2–2.3, 5.5–5.7, 8.5–8.6, 11.3 and the assessment/follow-up portion of 19.3.

#### Acceptance Criteria

1. WHEN a check node carries a local block, task or reveal, THE Node Schema SHALL reject it.
2. WHEN a check node has attempt 2 and scored true, THE Node Schema SHALL reject it.
3. WHEN a scene is listed in lesson checks, THE LocalEngine SHALL compile a check node with attempt 1 and keep its answer inside the Engine.
4. WHEN a scene has a research field, THE LocalEngine SHALL compile a research node associated with the relevant assessment answer.
5. WHEN lesson result is present, THE LocalEngine SHALL compile a result node.
6. Check nodes SHALL have no task line and SHALL set canGoBack to false.
7. WHEN a check is at attempt 2, THE LocalEngine SHALL mark it unscored.
8. Check scoring and answer judgment SHALL remain engine-owned; renderer components SHALL receive no raw answer value.
9. WHEN the demo's assessment or follow-up assessment entry point is selected, THE Demo Controls SHALL start a session at the corresponding compiled node. THE Demo Controls SHALL enable each entry point only when its node and interaction are supported.

### Requirement CH4: Shared interaction mode

**User Story:** As a developer, I want all interactions to follow one shared mode contract, so choices, hotspots, sequence and inspect behave consistently.

**Source trace:** migrated from player-core Requirement 13.

#### Acceptance Criteria

1. WHERE an interaction has no local block, THE Mode Logic SHALL classify it as open.
2. WHERE an interaction has a local block, THE Mode Logic SHALL classify it as practice and judge each try from that block.
3. WHERE the node is a check, THE Mode Logic SHALL classify it as check, check mode SHALL take precedence, and the Engine SHALL judge every try.
4. FOR ALL supported interaction nodes, THE Mode Logic SHALL classify the node into exactly one of open, practice or check.
5. Specs 3 and 4 SHALL reuse this shared mode contract and SHALL NOT implement a divergent classifier.

### Requirement CH5: Practice feedback and reveal

**User Story:** As a child, I want gentle feedback when I am wrong, so a wrong answer feels like a nudge rather than a failure.

**Source trace:** migrated from player-core Requirement 14.

#### Acceptance Criteria

1. WHEN wrong try n occurs in practice mode, THE Feedback Ladder SHALL use the corresponding onWrong message when present, else hint, else “Not yet. Try again.”
2. THE Feedback Ladder SHALL accompany a wrong try with a gentle shake and low tone, not a red cross or failure sound.
3. WHEN revealAfter wrong tries have occurred, THE Feedback Ladder SHALL reveal the correct target, and the child SHALL still make the final selection.
4. WHEN the child gives the correct answer in practice mode, THE Mode Logic SHALL submit the final answer with wrongTries set to the count of wrong tries.
5. The correct answer used for local practice judgment SHALL be provided only through the practice-local runtime contract; raw content answer fields SHALL not be copied onto renderer nodes.

### Requirement CH6: Check confirmation

**User Story:** As a child taking an assessment, I want to confirm my answer, so an accidental tap costs no score.

**Source trace:** migrated from player-core Requirement 15.

#### Acceptance Criteria

1. WHEN a check node is at attempt 1, THE Check Confirmation SHALL show an “Only the first try counts” banner.
2. THE Check Confirmation SHALL require an answer selection followed by activation of “That’s my answer” before submitting; a permitted empty inspect selection counts as an answer.
3. WHILE submission is in flight, THE Check Confirmation SHALL disable the interaction.
4. WHEN a retry follows an error, THE Player SHALL reuse the same answerRequestId; core Engine idempotency SHALL return an already-processed result without re-scoring.
5. WHEN attempt is 2, THE Check Confirmation SHALL explain that the try does not count for the score.

## Cross-spec invariants

- The Engine decides correctness and progression; the Player renders and submits stable answers.
- No component branches on child identity.
- profileId, playerId and sessionId retain the meanings established by player-core.
- Sequence and inspect reuse the shared mode and feedback machinery defined here.
