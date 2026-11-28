# Requirements Document

## Introduction

This spec builds the **core of the Mystira Player**: the project scaffold, shared node and Engine contracts, `LocalEngine`, the scene renderer, the Next button, and shared presentation capabilities. The spec is the first of four and ships no interaction type beyond `continue` (the Next button). Spec 2 defines choices, hotspots and shared practice/check behavior; Specs 3 and 4 add sequence and inspect.

The authoritative sources are `docs/tech-spec.md` (sections 1 to 8, 10, 11 and 15) and `docs/content-format.md`. The content is `content/manor/pumpkin-gate.story.yaml`; the JSON schema to mirror is `schema/story-schema-2.1.json`.

Mental model enforced by this spec:

- **Engine decides, player renders.** The renderer sees only the `Engine` interface. Anything that chooses a version, order or correctness for a child belongs to an engine; `LocalEngine` gets those choices from the `demo` block. No component branches on a child's identity.
- **One content format.** Content is Mystira story YAML 2.1. Nodes are the runtime shape `LocalEngine` compiles the YAML into; there is no JSON node format for content.
- **Identifiers are `profileId`, `playerId` and `sessionId`.** There is no `childId`.
- **Required 2.0 fields stay required.** This is the most likely content mistake; the schemas reject it.
- **Scope boundary.** Four core interaction families are planned across the four specs. This spec ships only `continue`.

## Glossary

- **Player**: the Mystira Player application: the renderer and the Player's controls.
- **Scaffold**: the project build setup (Vite, React 19, TypeScript strict, pnpm, Vitest) and the `index.html` entry.
- **Node Schema**: the Zod schema for runtime nodes in `src/schema/node.ts`.
- **Story YAML Schema**: the Zod schema for story YAML 2.1 in `src/schema/story-yaml.ts`.
- **Engine Interface**: the TypeScript interface in `src/engine/types.ts`.
- **LocalEngine**: the engine in this repository that compiles story YAML into nodes and reads the `demo` block.
- **Scene Renderer**: the components that render a scene's media, characters, dialogue, overlays and task.
- **Next Button**: the `continue` interaction control.
- **Auto-advance**: a content setting that, when enabled on a `continue` scene node, advances the player to the next node automatically after the dialogue audio finishes, without requiring a tap on the Next Button.
- **Back control**: the navigation control the Scene Renderer shows when `canGoBack` is true.
- **Notes Panel**: the panel that shows a node's rationale to the grown-up.
- **Audio Lifecycle**: the controller that cancels and stops audio, speech and video.
- **Density**: the module that sets tap target size, text size and narration default by age group.
- **Demo Controls**: standalone-shell profile and entry-point controls plus notes toggle, shown only in local demo mode.
- **Manor theme**: the friendly-spooky theme for the Kiroween entry.
- **config.json**: the runtime configuration file, which is not secret.
- **interactions.enabled**: the `config.json` list of interaction types the build supports.
- **Node**: a scene plus at most one interaction.
- **Scene**: a unit with media, characters, dialogue, overlays and an optional task.
- **Interaction**: the actionable part of a node. In this spec, only `continue` is rendered.
- **Step**: the runtime unit an engine returns on each turn.
- **Session**: one play-through of an activity.
- **Engine**: an implementation of the Engine Interface.
- **Speaker**: a character who delivers a dialogue line.
- **Line**: one unit of dialogue with a speaker and text.
- **Narration**: the text or audio for the task instruction.
- **Rationale**: the grown-up note explaining why a piece differs per child.
- **profileId**: a child's persistent profile. **playerId**: a seat in one session. **sessionId**: one play-through. **accountId**: the signed-in grown-up's account; the Player never sends `accountId`.

## Requirements

### Requirement 1: Project scaffold and toolchain

**User Story:** As a developer, I want the project scaffolded with the agreed toolchain, so that I can build, test and run the player from a fresh clone.

#### Acceptance Criteria

1. THE Scaffold SHALL provide a Vite application using React 19, TypeScript in strict mode and pnpm.
2. THE Scaffold SHALL configure Vitest for unit and component tests.
3. THE Scaffold SHALL add the module entry script to `index.html` so the application boots into the `#root` element.
4. WHEN a developer runs the dev and build commands from a fresh clone, THE Scaffold SHALL start and build the application without error.

### Requirement 2: Runtime node schema

**User Story:** As a developer, I want a Zod schema for runtime nodes, so that every node handed to the renderer is validated and typed.

#### Acceptance Criteria
1. THE Node Schema SHALL define schemas for the shared scene, check, research and result node shapes.
2. FOR ALL valid Node objects, parsing, serializing and parsing again SHALL produce an equivalent Node.
3. WHEN a node or interaction type is not enabled in config, THE Node Schema SHALL raise an unsupported outcome.

### Requirement 3: Story YAML 2.1 schema

**User Story:** As a developer, I want a Zod schema for story YAML 2.1, so that content validates against one format and existing stories still parse.

#### Acceptance Criteria

1. THE Story YAML Schema SHALL mirror `schema/story-schema-2.1.json`, accepting every Mystira story field and treating engine fields as opaque values.
2. WHEN a story file with no 2.1 additions is provided, THE Story YAML Schema SHALL parse the file as valid 2.1 content.
3. WHEN a story file omits a required 2.0 field, THE Story YAML Schema SHALL reject the file with a descriptive error naming the missing field.
4. FOR ALL valid story YAML files, parsing a file, then formatting the result, then parsing the formatted result SHALL produce an equivalent object (round-trip property).

### Requirement 4: Engine interface

**User Story:** As a developer, I want the Engine interface defined exactly, so that the renderer stays engine-agnostic and any engine can implement the interface.

#### Acceptance Criteria

1. THE Engine Interface SHALL define `listProfiles`, `getHome`, `startSession`, `resumeSession` and `respond`, with `listProfiles` and `getHome` marked optional.
2. THE Engine Interface SHALL type `Answer` as a discriminated union that includes `continue` and `back`.
3. THE Engine Interface SHALL type `AnswerSubmission` to carry `answerRequestId`, `version`, `nodeId`, `answer`, optional `wrongTries` and optional `playerId`.
4. THE Engine Interface SHALL define `EngineError` with kinds `network`, `auth`, `notFound`, `conflict`, `unsupported` and `server`.
5. THE Engine Interface SHALL define `Step` to carry `sessionId`, `version`, `ageGroupId`, `players`, `node`, optional `canGoBack`, optional `progress` and optional `prefetch`.
6. THE Engine Interface SHALL identify children by `profileId`, participants by `playerId` and play-throughs by `sessionId`.

### Requirement 5: LocalEngine story compilation

**User Story:** As a developer, I want LocalEngine to compile the demo story YAML into nodes, so that the player runs the Kiroween demo without a server.

#### Acceptance Criteria
1. WHEN a supported narrative scene has next_scene and no interaction block, THE LocalEngine SHALL produce a scene node with continue navigation.
2. WHEN a scene has no lines, THE LocalEngine SHALL emit the description as a narrator line.
3. WHEN a supported scene has lines, task, cast, overlays, media and music, THE LocalEngine SHALL map those fields to the corresponding scene-node fields.
4. WHEN a scene is roll or special, or uses stage3d only, THE LocalEngine SHALL raise unsupported.

### Requirement 6: LocalEngine per-child versions from the demo block

**User Story:** As a grown-up, I want each demo child to see the same pieces taught differently, so that the demo shows how Mystira adapts to a child.

#### Acceptance Criteria

1. THE LocalEngine SHALL read the `demo` block to choose each profile's version of each piece and the piece order.
2. WHEN two demo profiles name different versions of the same piece, THE LocalEngine SHALL compile the version named for the active profile.
3. WHERE a profile's `order` is `fixed`, THE LocalEngine SHALL present pieces in lesson order.
4. WHERE a profile's `order` is `child_chooses`, THE LocalEngine SHALL let the child choose the order.
5. THE LocalEngine SHALL take each piece's `rationale` from the `demo` block and attach the rationale to the rendered node.
6. THE LocalEngine SHALL keep all per-child logic inside itself; THE Scene Renderer SHALL branch on no child identity.

### Requirement 7: Runtime answer privacy

**User Story:** As a child-safety reviewer, I want raw content answers kept out of renderer nodes, so stored answers cannot be exposed by the player.

#### Acceptance Criteria

1. THE LocalEngine SHALL NOT copy raw answer fields from story content onto runtime nodes.
2. THE LocalEngine SHALL keep assessment answers and raw content answer fields out of nodes and interactions. Public choice and object IDs MAY coincide with an answer value; practice feedback MAY use the transformed practice-local runtime contract.


### Requirement 8: LocalEngine session control

**User Story:** As a developer, I want session control rules enforced in the engine, so that replays, conflicts and back navigation behave consistently.

#### Acceptance Criteria

1. WHEN `respond` is called with a repeated `answerRequestId`, THE LocalEngine SHALL return the same Step (idempotency property).
2. WHEN `respond` is called with a stale `version`, THE LocalEngine SHALL fail with an `EngineError` of kind `conflict` carrying the current Step.
3. WHERE `canGoBack` is false on a node, THE LocalEngine SHALL reject a `back` answer.
4. WHERE `canGoBack` is true on a node, THE LocalEngine SHALL accept a `back` answer.

### Requirement 9: Scene renderer media, characters and transitions

**User Story:** As a child, I want to see the scene picture with the characters in the picture, so that the story comes to life.

#### Acceptance Criteria

1. THE Scene Renderer SHALL render the scene image or the scene video in a fixed 16:9 logical box, letterboxed to fit the container.
2. WHEN a video has `onEnd: advance`, THE Scene Renderer SHALL advance automatically on video end.
3. WHERE a video has `skippable: true`, THE Scene Renderer SHALL show a skip button.
4. THE Scene Renderer SHALL place up to three characters in left, center and right slots.
5. WHEN multiple characters are assigned to the same slot, THE Scene Renderer SHALL enforce unique slot assignment by rejecting or reassigning duplicate assignments, so that each of left, center and right holds at most one character.
6. WHEN a character has `reactions`, THE Scene Renderer SHALL play one reaction as a short animation with a tone on tap, and THE Scene Renderer SHALL neither count the tap as an answer nor advance the node.
7. WHERE `prefers-reduced-motion` is set, THE Scene Renderer SHALL replace a reaction animation with a small bounce.
8. THE Scene Renderer SHALL cross-fade between nodes by default, and THE Scene Renderer SHALL turn decorative motion off under `prefers-reduced-motion`.

### Requirement 10: Scene renderer dialogue and narration

**User Story:** As a child, I want to hear and read the dialogue, so that I can follow the story even without reading.

#### Acceptance Criteria

1. THE Scene Renderer SHALL play dialogue lines in order, each shown with the speaker's avatar, name and colour.
2. WHEN a line has recorded `audioUrl`, THE Scene Renderer SHALL play the recorded audio.
3. WHEN a line has no recorded audio, THE Scene Renderer SHALL narrate the line using `speechSynthesis` with the speaker's `pitch` and `rate`.
4. WHEN neither recorded audio nor speech synthesis is available, THE Scene Renderer SHALL keep the text on screen, SHALL keep interactions usable, and SHALL show a visible Next control so that the screen never appears stuck.
5. WHEN an interaction is tapped, THE Scene Renderer SHALL cancel ongoing speech.
6. THE Scene Renderer SHALL provide a replay control that replays the current line.
7. THE Scene Renderer SHALL always show a visible Next control so that a screen with no playing audio never appears stuck or frozen.

### Requirement 11: Scene renderer overlays and task

**User Story:** As a child, I want callouts on the picture and a clear task line, so that I know what to do.

#### Acceptance Criteria

1. THE Scene Renderer SHALL render each overlay at the overlay's anchor, on a backing plate, clamped to a safe area, with contrast meeting WCAG 2.2 AA.
2. WHEN a node has a `task`, THE Scene Renderer SHALL render the task line.

### Requirement 12: Continue and back navigation

**User Story:** As a child, I want a Next button to move the story on and a Back button to undo, so that I control the pace.

#### Acceptance Criteria

1. WHEN a scene node has a `continue` interaction, THE Scene Renderer SHALL show a Next button with the optional label.
2. WHEN the Next button is activated, THE Player SHALL submit an answer of kind `continue`.
3. WHERE `canGoBack` is true on a node, THE Scene Renderer SHALL show a Back control.
4. WHEN the Back control is activated, THE Player SHALL submit an answer of kind `back`.
5. THE Next Button and the Back control SHALL be operable by keyboard and SHALL meet the Density minimum tap target for the node's age group.

### Requirement 16: Notes panel

**User Story:** As a grown-up, I want to see why a piece differs per child, so that I understand the adaptation.

#### Acceptance Criteria

1. THE Notes Panel SHALL show the node `title`, a "same for every child" or "different for each child" tag from `rationale.differs`, and the `rationale.text`.
2. THE Notes Panel SHALL be available only in demo mode or to the signed-in grown-up.
3. WHILE a child plays alone, THE Notes Panel SHALL be hidden.
4. WHEN a node has no rationale, THE Notes Panel SHALL be hidden.

### Requirement 17: Presentation density by age group

**User Story:** As a child, I want the right tap target and text size for my age, so that the player is easy to use.

#### Acceptance Criteria

1. WHERE the age group is `6-9`, THE Density SHALL set a minimum 48 px tap target and large on-screen text, and SHALL default narration to on.
2. WHERE the age group is `1-2` or `3-5`, THE Density SHALL set a minimum 64 px tap target and short on-screen lines, and SHALL autoplay narration after the first user gesture.
3. WHERE the age group is `10-12`, `13-18` or `19+`, THE Density SHALL set a minimum 44 px tap target and full paragraphs, and SHALL default narration to off with a replay control available.
4. THE Density SHALL allow narration to be toggled, and the toggle SHALL persist for the session.

### Requirement 18: Audio lifecycle

**User Story:** As a host, I want the player to clean up audio when the player leaves, so that the player leaks no sound or request.

#### Acceptance Criteria

1. WHEN a node changes, THE Audio Lifecycle SHALL cancel ongoing speech.
2. WHEN the player unmounts, THE Audio Lifecycle SHALL stop all audio, speech and video and abort in-flight requests.

### Requirement 19: Demo controls

**User Story:** As a grown-up reviewing the demo, I want to switch children and days and open notes, so that I can compare how the lesson adapts.

#### Acceptance Criteria

1. WHERE `config.json` sets `mode: local` and `demo: true`, THE Demo Controls SHALL show a child switch, an entry-point switch and a notes toggle.
2. WHEN the child switch is used, THE Demo Controls SHALL jump to the same piece for the other demo child.
3. WHEN the lesson entry point is selected, THE Demo Controls SHALL start the lesson; entry points whose nodes are not supported by the enabled interactions SHALL remain disabled. Spec 2 owns enabling assessment and follow-up assessment entry points after their nodes are compiled.
4. THE Demo Controls SHALL render outside the player root, so the controls appear in no embedded player.

### Requirement 20: Styling and the Manor theme

**User Story:** As a child, I want the player to look friendly-spooky, so that the Manor feels welcoming rather than frightening.

#### Acceptance Criteria

1. THE Scene Renderer SHALL style with CSS Modules and CSS custom property tokens.
2. THE Manor theme SHALL provide the friendly-spooky palette: deep plum and candle-orange, warm glows, rounded shapes and no sudden motion.
3. THE Scene Renderer SHALL meet WCAG 2.2 AA contrast for every text-on-background and overlay token pair, with a 4.5:1 minimum ratio for normal text and a 3:1 minimum ratio for large text and graphical or UI components.

### Requirement 21: Configurable scene auto-advance

**User Story:** As a content author, I want to mark a story as auto-advancing, so that a child can relax and listen without tapping through every scene.

> Note: This feature extends `schema/story-schema-2.1.json` and `docs/content-format.md` with a new auto-advance field. This is a deliberate product decision by the project owner and overrides the steering rule "Do not add fields that are not in `schema/story-schema-2.1.json`." The design phase SHALL determine the exact YAML field name and whether it applies per-story, per-scene, or both, and SHALL update the JSON schema, the Zod Story YAML Schema, and `docs/content-format.md` accordingly.

#### Acceptance Criteria

1. THE Story YAML Schema SHALL define an auto-advance field that enables or disables automatic advancement of `continue` scene nodes.
2. WHEN auto-advance is enabled on a scene node with a `continue` interaction, and the dialogue audio finishes, THE Scene Renderer SHALL advance to the next node automatically without requiring a tap on the Next Button.
3. WHEN auto-advance is enabled on a node with a non-`continue` interaction, THE Scene Renderer SHALL stop auto-advancing and SHALL wait for the child's interaction.
4. WHEN auto-advance is disabled or not set, THE Scene Renderer SHALL wait for the child to tap the Next Button after dialogue completes.
5. THE Scene Renderer SHALL always show a visible Next Button even when auto-advance is enabled, so that the child is never stuck if audio fails or wants to skip ahead.
6. WHEN no recorded audio and no speech synthesis is available, THE Scene Renderer SHALL wait for an explicit tap on the Next Button before advancing, because reading speed varies between children and no timers are used.
