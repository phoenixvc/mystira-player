---
inclusion: always
---

# Tech

Full detail: `docs/tech-spec.md`. Follow it; if a task seems to need something it rules out, stop and ask.

## Stack

- React 19, TypeScript strict, Vite. pnpm.
- Zod for every node, interaction and the content format; infer types from the schemas, never hand-write a parallel type.
- Standalone routing: TanStack Router. Embedded: in-memory state only; never touch the host's URL or history.
- TanStack Query only inside `RemoteEngine`.
- Styling: CSS custom properties (theme tokens) plus CSS Modules, injected into the shadow root. No CSS-in-JS runtime.
- Narration: recorded audio when given, otherwise `speechSynthesis` with per-speaker pitch and rate. Feedback sounds: generated Web Audio tones. No audio files for interaction sounds.
- Tests: Vitest and React Testing Library; MSW for `RemoteEngine` contract tests; Playwright for end-to-end and the element harness, with axe on every node and interaction type (tech spec section 15).
- Bundle budget: element build under 140 kB gzipped, excluding media.

## Architecture rules

- The renderer talks only to the `Engine` interface (`src/engine/types.ts`, tech spec section 5). It never knows which engine it has, never reads content graphs, never works out a child's version of a piece.
- `LocalEngine` compiles story YAML into nodes (tech spec section 7) and is the only place that reads the `demo` block. It strips every `answer` before building a node.
- A node is a scene plus at most one interaction.
- Interactions support three modes: **open** (any answer moves on), **practice** (the player gives feedback each try, with the feedback ladder and `revealAfter`), **check** (the child confirms with "That's my answer"; the engine judges).
- Interaction types are enabled by config (`interactions.enabled`); stretch types are off by default.

## Identifiers (use these names exactly)

- `profileId`: a child's persistent profile. `playerId`: a seat in one session. `sessionId`: one play-through. `accountId`: never sent by the player.
- There is **no `childId`**. Do not introduce one.
- `AnswerSubmission` carries `answerRequestId`, `version`, `wrongTries` and `playerId`. `Answer` includes `continue` and `back`.
- Age groups are the strings `1-2`, `3-5`, `6-9`, `10-12`, `13-18`, `19+`.

## Auth

Standalone: OIDC authorisation code with PKCE (`oidc-client-ts`) against Mystira Identity, as a public client for adult accounts only. Embedded: no auth at all. Children never sign in.
