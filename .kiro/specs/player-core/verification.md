# Player core acceptance evidence

This records the current branch evidence for the player-core requirements. A checked implementation task means its scoped behavior is present and verified; this table does not turn the Spec 2 dependency into a completed player-core acceptance criterion.

| Requirement | Implementation | Verification | Status |
|---|---|---|---|
| 1. Scaffold | `index.html`, `package.json`, `tsconfig.json`, `vite.config.ts` | `pnpm typecheck`, `pnpm build`, `pnpm test`; connected browser boot | Verified |
| 2. Runtime node schema | `src/schema/node.ts`, `node-base.ts`, `interactions.ts` | `src/schema/node.test.ts` generated round trips and rejection cases | Verified |
| 3. Story YAML | `src/schema/story-yaml.ts`, `schema/story-schema-2.1.json` | `src/schema/story-yaml.test.ts` parity, required fields and round trips; content checker reports zero problems for both Manor stories | Verified for authored content and tested generated values |
| 4. Engine interface | `src/engine/types.ts` | Strict TypeScript build and the `LocalEngine`/`Player` implementations | Verified |
| 5. Continue scene compilation | `src/engine/local/compiler.ts` | `src/engine/local/compiler.test.ts` mapping, unsupported interactions, generated variants | Verified |
| 6. Demo versions and piece order | `src/engine/local/LocalEngine.ts`, `src/app/App.tsx` | `src/engine/local/LocalEngine.test.ts`, `src/app/App.test.ts`, `pieceChoice.test.tsx` | Verified for supported lesson scenes |
| 7. Runtime answer privacy | `src/engine/local/compiler.ts` | `src/engine/local/compiler.test.ts` checks authored answers stay out of emitted nodes | Verified |
| 8. Session control | `src/engine/local/LocalEngine.ts` | `src/engine/local/LocalEngine.test.ts` replay, conflict, Back, failed transition and generated linear paths | Verified for supported scenes |
| 9–12. Scene presentation and navigation | `src/player/Player.tsx`, `Player.module.css` | `src/player/Player.test.tsx`; connected desktop and narrow browser pass | Verified for continue scenes |
| 16–18. Notes, density and lifecycle | `src/player/Player.tsx`, `Player.module.css` | `src/player/Player.test.tsx` notes, playback races, abort and cleanup; `src/app/App.test.ts` demo visibility | Verified for the local/demo and trusted-host paths |
| 19. Demo controls | `src/app/App.tsx`, `localDemo.ts` | `src/app/App.test.ts`, `pieceChoice.test.tsx` | **Partial:** 19.3 assessment and follow-up entry points await Spec 2 node compilation; controls remain disabled |
| 20. Manor styling | `src/theme/tokens.ts`, `src/player/Player.module.css`, `src/app/App.module.css` | `src/theme/tokens.test.ts` contrast pairs; mobile Lighthouse accessibility 100 on landing and active scene | Verified for current surfaces |
| 21. Auto-advance | `src/player/Player.tsx`, `src/schema/story-yaml.ts`, `schema/story-schema-2.1.json` | `src/player/Player.test.tsx` recorded narration and no-audio fallback; `src/schema/story-yaml.test.ts` content round trip | Verified for continue scenes |

Current source pass: 74 Vitest tests pass, typecheck and build pass, and `git diff --check` is clean. The browser pass covered the core preview's two continue scenes and end view at desktop and narrow widths. It did not exercise the full Manor assessment path. Requirement 19.3 and task 7.5 remain open until Spec 2 supplies assessment and follow-up nodes. Task 9.3 remains open until that gap is verified.
