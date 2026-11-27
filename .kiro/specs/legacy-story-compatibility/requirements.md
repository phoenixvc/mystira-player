# Requirements: Legacy Story Compatibility

## Introduction

This is Spec 5. Specs 1–4 build the Kiroween player and its four core interaction types. This spec makes the same player usable inside the existing Mystira Blazor app for stories the app already plays. It is a separate compatibility release gate; the existence of this plan does not make the current build compatible.

The source of truth is the current Blazor `GameSessionPage`, `SceneActionPanel`, `RollScene`, `SceneMediaDisplay`, `GameSessionService`, and scene DTOs in `mystira-workspace`, together with representative, non-sensitive story fixtures. The compatibility matrix must be refreshed against the integration branch when work begins. The new player remains a renderer driven by an `Engine`; Blazor owns its account, session services, page chrome, AI guide, inventory, journal, settings, and awards.

## Requirements

### Requirement 1: Evidence-based compatibility boundary

**User story:** As a maintainer, I want a measured compatibility matrix, so that a format claim is not mistaken for playback equivalence.

1. THE compatibility review SHALL inventory scene types, media forms, navigation rules, session states, and player-visible interactions supported by the current Blazor story player.
2. THE review SHALL test representative legacy YAML and actual API/DTO shapes, including string and numeric scene-type values, without using real child data.
3. FOR EACH inventoried case, THE matrix SHALL record `supported`, `host-rendered`, `unsupported`, or `not applicable`, with a fixture and test or a documented reason. The in-scope set SHALL include every scene behavior the current Blazor app can play for an authorized story; a difficult case cannot be omitted to make the gate pass.
4. THE project SHALL claim full Blazor playback compatibility only when every in-scope case is supported or host-rendered and the integration acceptance tests pass. Otherwise its public wording SHALL state the narrower supported subset.
5. THE review SHALL distinguish a visible control from working behavior. In the audited page, Rewind is a no-op pending an authoritative checkpoint contract; parity SHALL not imply working rewind until that contract exists.

### Requirement 2: One content contract and a legacy adapter

**User story:** As a host developer, I want existing content and session DTOs mapped to the player without rewriting stories.

1. THE adapter SHALL accept the existing story YAML 2.0/2.1 fields and the Blazor API's scene DTOs without requiring a second authored content format.
2. THE adapter SHALL map legacy scene-type names and numeric values to explicit player behavior, preserving the raw type for diagnostics. It SHALL NOT silently turn a type with distinct behavior into an ordinary narrative scene.
3. THE adapter SHALL preserve scene IDs, branch destinations, media references, narrator text, character identity, and allowed back/exit state.
4. WHEN a scene cannot be represented, THE adapter SHALL return a typed unsupported result with the scene ID and raw type; it SHALL NOT advance past that scene.
5. THE adapter SHALL resolve relative assets against the content base and allow the host to resolve protected media through its existing service.
6. THE adapter SHALL preserve branch identity, authored order and compass metadata; the host SHALL validate the displayed choice index against the ordered choices before recording it.
7. THE adapter SHALL preserve active character identity, portrait, scene tone, Markdown text, narration word timings, scene music and sound-effect cues where present.

### Requirement 3: Legacy story navigation and lifecycle

**User story:** As a child, I want an embedded story to resume and finish where the current app would.

1. THE host engine SHALL use the existing authorized session as the authority for start, resume, current scene, branch choice, pause/resume, and completion. Back SHALL be exposed only when the host supports an authoritative checkpoint operation; the current Blazor Rewind handler is a no-op.
2. WHEN a choice is submitted, THE host engine SHALL follow the selected branch's destination and preserve the current app's player attribution and choice ordering.
3. WHEN a request is retried with the same `answerRequestId`, THE host engine SHALL return the same outcome without recording or navigating twice.
4. WHEN the session is completed or no forward path exists, THE player SHALL show a terminal state and notify the host once. It SHALL NOT show an active Next control into a dead end.
5. WHEN an embedded player unmounts and remounts, THE host SHALL be able to resume the same session without changing the Blazor page URL or losing the current scene.
6. THE host SHALL preserve character-to-player assignments, including profile, guest and AI turns, and prevent human submission during an AI turn while its existing AI player service acts.

### Requirement 4: Roll scenes

**User story:** As a child, I want to play an existing roll scene in the shared player and see the outcome before continuing.

1. THE player SHALL render a roll prompt, accessible roll control, animated or reduced-motion result, target when applicable, outcome message, and Continue control.
2. WHEN the child rolls, THE player SHALL submit a `roll` answer once; THE host engine SHALL determine or reproduce the legacy roll result and success state, and return a resolved step. THE player SHALL NOT choose the branch or compute success from the target.
3. WHEN the resolved roll is continued, THE host engine SHALL choose the existing success/failure branch, including the current app's no-forward-path handling.
4. THE roll and Continue requests SHALL be idempotent. A remount after resolution SHALL show the same result rather than rolling again.
5. THE roll interaction SHALL be capability-gated and tested independently of the four Kiroween interaction types.

### Requirement 5: Special scenes and 3D media

**User story:** As a host developer, I want the shared player to keep a story playable when it reaches a special or 3D scene.

1. THE compatibility matrix SHALL classify the actual `special` scene behaviors and each currently used 3D media form before assigning a renderer.
2. THE player SHALL render supported special scenes directly or reserve a bounded, accessible scene-stage extension for a host renderer; it SHALL NOT hand the child to an unrelated page without preserving session continuity.
3. WHEN the host supplies a 3D renderer, THE player SHALL preserve a poster or accessible fallback, focus behavior, media cleanup on node change/unmount, and the host's media URL and CORS rules.
4. WHEN a required host renderer is unavailable, THE player SHALL show an explicit, recoverable unsupported state and notify the host without skipping the scene.

### Requirement 6: Blazor embedding boundary

**User story:** As a Blazor maintainer, I want one embedded player that coexists with the current app's services and chrome.

1. THE Blazor page SHALL mount `<mystira-player>` and provide its `Engine` adapter, theme, media resolver, and authorized session context through the documented embedding contract.
2. THE element SHALL emit node, answer, completion, unsupported, and error events with no answer values or child profile details in telemetry event payloads.
3. THE Blazor host SHALL own account authentication, permissions, navigation lock, exit/pause controls, AI guide, inventory, journal, roll log, settings, and awards. These SHALL NOT be duplicated inside the element.
4. THE element SHALL make no independent API requests, alter no host URL/history, leak no styles, and stop audio/video/speech when unmounted.
5. THE host SHALL keep its rails and settings synchronized from its authoritative session services and the element's lifecycle events; it SHALL NOT treat sanitized answer events as authoritative state.
6. THE integration SHALL preserve recorded narration playback, word highlighting and word-tap seeking where timing data exists, as well as host music ducking, media-action audio coordination, volume/text-size settings and scene sound effects. Audio ownership and cleanup SHALL be explicit so the host and element do not play the same clip twice.
7. THE host SHALL own session finalization, badge eligibility and awards navigation, including guest and out-of-age cases, and SHALL perform these operations once per completed session.

### Requirement 7: Acceptance and migration safety

**User story:** As a release owner, I want evidence that existing stories behave equivalently before replacing the Blazor scene surface.

1. THE acceptance suite SHALL replay representative narrative, choice, roll, special, image/video/audio, 3D, pause/resume, exit, and terminal paths through the old and embedded players. It SHALL test Back only if a host checkpoint operation is implemented.
2. THE suite SHALL verify session ID, scene ID, branch destination, roll outcome, completion state, player attribution, and no duplicate submission for matched paths.
3. THE suite SHALL verify keyboard/focus behavior, reduced motion, media fallback, audio cleanup, no style leakage, and no independent network calls from the element.
4. THE integration SHALL launch behind a host-controlled flag, with a reversible fallback to the existing Blazor scene surface until the matrix and signed-in acceptance pass.
5. THE project SHALL keep source tests, hosted deployment health, and signed-in story acceptance as separate gates.
6. THE acceptance suite SHALL cover character assignments and AI turns, choice compass/index attribution, narration timing/seek, host audio settings, finalization/awards, empty-session recovery and navigation confirmation. It SHALL record Rewind as unavailable in the current host unless checkpoint support is added.
