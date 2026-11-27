# Requirements: Third-Party Scenario Embedding

## Purpose

Spec 6 makes the same player useful in applications outside Mystira. It is a reusable-product gate after the renderer and embedding contracts exist, separate from Kiroween scope and Spec 5's Blazor migration. The player presents engine-supplied scenes and interactions; a host owns its participants, content, session authority, transport, media rights and surrounding application.

Representative scenarios to validate:

| Scenario | Needed capability |
|---|---|
| Museum or escape-room team station | Shared scene, hotspots/clues, turn or group decision, intermittent connection and kiosk reset |
| Live training or tabletop exercise | Roles, video/audio briefing, timed choice or vote, facilitator-controlled reveal and debrief |
| Collaborative story or tabletop game | Character seats, branching dialogue, dice/roll outcome, host-owned inventory and journal |
| Interactive film or watch party | Synchronized media scene, accessible choice window, quorum/deadline and late-join recovery |

The examples are design fixtures, not a promise that all four products ship with this spec.

## Requirements

### Requirement 1: Portable host contract

1. THE package SHALL expose a documented, versioned `Engine` and `Step` contract usable from plain HTML, React and a non-React host without Mystira Identity, Mystira services or Mystira story YAML.
2. THE player SHALL accept validated runtime nodes from a host adapter; Mystira YAML remains an optional authored input for `LocalEngine`, not a requirement on third-party content.
3. THE host SHALL be able to provide an authorized engine, theme, locale, media resolver and permitted presentation extensions without modifying player internals.
4. THE player SHALL negotiate optional capabilities and reject an unknown node, interaction or extension with a typed recoverable result. It SHALL not silently reinterpret it as `continue`.
5. THE published package SHALL include version compatibility rules, an integration guide, example adapters and a minimal plain-HTML sample.
6. WHERE a host needs an interaction beyond the built-in set, THE package SHALL support a versioned, capability-gated action extension with a validated data descriptor and a typed answer. Authored content SHALL not inject executable code.

### Requirement 2: Multiplayer session model

1. THE engine contract SHALL represent participant seats and roles, active turn, shared scene/version, allowed actions and completion state without requiring a Mystira profile ID.
2. THE host engine SHALL decide whether a scene is solo, turn-taking, facilitator-driven or group-vote. It SHALL resolve votes, quorum, deadlines, ties, AI participants and branch selection; the player SHALL not infer those rules from visible content.
3. THE player SHALL distinguish a participant who can act from one who is waiting or observing, and SHALL show a clear, accessible waiting and result state.
4. THE host SHALL be able to push or request a new authoritative `Step` after another participant acts, a facilitator advances, or a deadline expires. Out-of-order updates SHALL not replace a newer step.
5. A reconnect, remount or late join SHALL restore the same shared scene and that participant's allowed actions from the host, without replaying a submitted answer.

### Requirement 3: Safe action protocol

1. EACH action SHALL carry an idempotency key, session version, node ID, action and host-issued participant context. The host SHALL validate permissions and action legality.
2. A stale or conflicting action SHALL return the current authoritative step and a recoverable status. The player SHALL discard stale local pending state and present the current scene.
3. The protocol SHALL separate a private participant answer from the public aggregate or resolved outcome; other seats SHALL not receive private answers through player events or steps.
4. Pending, accepted, rejected and resolved states SHALL be explicit so double taps, retries and reconnects cannot double-submit or silently lose an action.

### Requirement 4: Multimedia and extensibility

1. THE player SHALL render the supported scene media and interaction capabilities from validated descriptors, with captions/transcripts, text alternatives, reduced motion and keyboard operation.
2. THE host SHALL own protected-media authorization and URL resolution. The player SHALL stop owned audio/video on scene change and unmount and SHALL avoid duplicate playback when the host owns a channel.
3. A host scene-stage extension SHALL be bounded to the stage and receive presentation data only. It SHALL not gain engine authority, account tokens or unrestricted script execution from authored content.
4. A synchronized media or deadline scenario SHALL use host time and authoritative scene state; client timers SHALL only display remaining time and SHALL not decide the outcome.

### Requirement 5: Embedding, privacy and operational quality

1. THE element SHALL not own host URL/history, authentication, participant directory, inventory, journal, analytics or session persistence, and SHALL make no independent API request in embedded mode.
2. Element events SHALL be lifecycle signals with no answer values, private votes, profile IDs or access tokens. The host SHALL read its own authoritative state for telemetry and surrounding UI.
3. THE integration SHALL define mount/unmount cleanup, reconnect behavior, focus return, localization, responsive sizing and error/retry states.
4. THE package SHALL include an explicit license/content/branding boundary so adopters can use the code without assuming rights to Mystira story assets or marks.
5. THE release gate SHALL exercise at least two unrelated host samples, including one non-React host, and a multi-client session with turn, vote, disconnect/reconnect and conflicting actions.
