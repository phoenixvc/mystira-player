# Blazor story bridge: player-side contract

`BlazorInteropEngine` is a small `Engine` adapter for a Blazor `DotNetObjectReference`. It makes no API request and does not own story decisions. The Blazor host keeps the authorized session, player assignments, current scene, roll computation, branch navigation, pause/resume, media resolution, chrome and awards.

```js
import { BlazorInteropEngine } from '/mystira-player.js';

const player = document.querySelector('mystira-player');
player.engine = new BlazorInteropEngine(dotNetReference);
player.resume(authorizedSessionId);
```

The host object exposes `PlayerStartSession(request)`, `PlayerResumeSession(sessionId)` and `PlayerRespond(sessionId, submission)` with `[JSInvokable]`. Each returns either `{ step: Step }` or `{ error: { kind, message, currentStep? } }`. The host maps its private DTO to the public `Step` before returning; the adapter validates each returned step and stops on an unsupported shape. Use presentation-safe IDs and resolved media URLs. Do not return child records, bearer tokens, answer keys or Journey rationale. Host error messages must be safe to show to the player.

`PlayerRespond` receives the stable `answerRequestId`, `version`, `nodeId`, `answer` and optional `playerId`. The host must reject stale versions and make request IDs idempotent. The adapter does not retry an invocation. `AbortSignal` prevents delivery of a late result to an unmounted player, but cannot cancel an already-running .NET invocation; the host still owns duplicate prevention.

For a legacy roll, return `interaction: { type: 'roll', state: 'ready', target }`. On `{ kind: 'roll' }`, compute and persist the result using the existing host flow, then return the **same scene ID** with a newer version and `state: 'resolved'`, `result: { value, success, message }`. The player displays that result and sends `{ kind: 'continue' }`; the host follows the success/failure branch, including its no-forward-path rule. A remount must resume the resolved step. The player never calculates success from the target.

For a completed story path, return a `node` with `type: 'terminal'` and `interaction: { type: 'terminal' }`, plus the usual scene presentation fields. The player shows the ending without an assessment score or a Next action and emits `mp-complete`; the host must finalize the session and awards idempotently. Do not reuse the assessment `result` node for an ordinary story ending.

This document describes the player-side contract. The Blazor wrapper, DTO mapping, host method implementation, actual API snapshots, media/audio bridge and signed-in acceptance remain Spec 5 work. Keep the existing story surface behind the host flag until the compatibility gate passes.
