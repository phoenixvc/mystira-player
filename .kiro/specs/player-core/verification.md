# Player core acceptance evidence

This records the current branch evidence for the continue-only player-core requirements. Assessment and follow-up entry points are accepted in Spec 2 CH3.9 and task 2.4 after their nodes and interactions are supported.

| Requirement | Implementation | Verification | Status |
|---|---|---|---|
| 1. Scaffold | `index.html`, `package.json`, `tsconfig.json`, `vite.config.ts` | `pnpm typecheck`, `pnpm build`, `pnpm test`; connected browser boot | Verified |
| 2. Runtime node schema | `src/schema/node.ts`, `node-base.ts`, `interactions.ts` | `src/schema/node.test.ts` generated round trips and rejection cases | Verified |
| 3. Story YAML | `src/schema/story-yaml.ts`, `schema/story-schema-2.1.json` | `src/schema/story-yaml.test.ts` parity, required fields, interaction variants and round trips; content checker reports zero problems for both Manor stories | Verified for authored content and tested generated values |
| 4. Engine interface | `src/engine/types.ts` | Strict TypeScript build and the `LocalEngine`/`Player` implementations | Verified |
| 5. Continue scene compilation | `src/engine/local/compiler.ts` | `src/engine/local/compiler.test.ts` mapping, unsupported interactions, generated variants | Verified |
| 6. Demo versions and piece order | `src/engine/local/LocalEngine.ts`, `src/app/App.tsx` | `src/engine/local/LocalEngine.test.ts`, `src/app/App.test.ts`, `pieceChoice.test.tsx` | Verified for supported lesson scenes |
| 7. Runtime answer privacy | `src/engine/local/compiler.ts` | `src/engine/local/compiler.test.ts` checks authored answers stay out of emitted nodes | Verified |
| 8. Session control | `src/engine/local/LocalEngine.ts` | `src/engine/local/LocalEngine.test.ts` replay, conflict, Back, failed transition and generated linear paths | Verified for supported scenes |
| 9–12. Scene presentation and navigation | `src/player/Player.tsx`, `Player.module.css` | `src/player/Player.test.tsx`; connected desktop and narrow browser pass; edge overlay geometry at 400 px and 280 px; tall callout focus and scrolling at 280 px | Verified for continue scenes |
| 16–18. Notes, density and lifecycle | `src/player/Player.tsx`, `Player.module.css` | `src/player/Player.test.tsx` notes, playback races, callback identity, abort and cleanup; `src/app/App.test.ts` demo visibility | Verified for the local/demo and trusted-host paths |
| 19. Demo controls | `src/app/App.tsx`, `localDemo.ts` | `src/app/App.test.ts` including rapid profile switches, `pieceChoice.test.tsx`; browser shows disabled unsupported entry points | Verified for lesson entry, profile switching and notes; Spec 2 owns enabling assessment and follow-up |
| 20. Manor styling | `src/theme/tokens.ts`, `src/player/Player.module.css`, `src/app/App.module.css` | `src/theme/tokens.test.ts` contrast pairs; mobile Lighthouse accessibility 100 on landing and active scene | Verified for current surfaces |
| 21. Auto-advance | `src/player/Player.tsx`, `src/schema/story-yaml.ts`, `schema/story-schema-2.1.json` | `src/player/Player.test.tsx` recorded narration and no-audio fallback; `src/schema/story-yaml.test.ts` content round trip | Verified for continue scenes |

Original Spec 1 source pass: 79 Vitest tests pass, typecheck and build pass, and `git diff --check` is clean. The browser pass covered the core preview's two continue scenes and end view at desktop and narrow widths. This evidence closed the continue-only Spec 1 acceptance pass; later integration evidence follows.

## Full lesson entry integration (2026-11-28)

The standalone Lesson entry now loads `pumpkin-gate.story.yaml` when choices, hotspots, sequence and inspect are all enabled. The fixed-profile Engine path covers five pieces and stops before the separately selected assessment. A `child_chooses` profile uses Engine-provided starts and records each completed piece in the demo controls. Disabling any core interaction retains the continue-only preview; the separate practice, sequence, inspect and assessment entries remain gated by their own capabilities.

`src/app/localDemo.test.ts` checks full-story bootstrapping and both profile paths. `src/engine/local/LocalEngine.test.ts` checks all five fixed-profile pieces, the lesson boundary, explicit assessment start, all five child-chosen pieces, and authored scene continuation after a profile switch. `src/app/pieceChoice.test.tsx` checks piece completion tracking. The source pass had 126 Vitest tests and a production build. A local Playwright browser pass followed Lerato through choice, hotspot, inspect and the final two choices to `The End` (no automatic check), then opened Daan's five-piece picker, completed the sequence piece, and observed its Complete indicator. This is standalone demo evidence, not Blazor or signed-in acceptance.
