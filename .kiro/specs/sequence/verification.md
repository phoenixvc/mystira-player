# Spec 3 sequence verification

The sequence implementation is isolated in `feat/sequence-impl`, based on merged PR #20's `dev` head (`88b0118`). It enables `sequence` in the local demo and exposes the authored Daan sequence piece. The full fixed-profile lesson remains outside this slice while Inspect (Spec 4) is open.

## Requirement evidence

| Requirement | Evidence |
|---|---|
| 1. Bounded schema and answer privacy | Runtime node and Story YAML validation reject 2/6 items, duplicate IDs, blank labels, images without alt, and a practice order that is not an exact permutation. The compiler tests verify transformed local order and absence of raw answer fields. A synthetic check test confirms no answer/order appears in the rendered check node. |
| 2. Engine order | LocalEngine produces a stable mixed order per session and preserves it on resume. The compiler retains the supplied item order. The renderer has no shuffle path. |
| 3. Place, Undo, Done | Component tests cover all six 3-item placement permutations, exact submitted IDs, Undo and no submission on final placement. Player tests cover Engine submission only after Done. |
| 4. Shared modes | Player tests cover open, practice with feedback/reveal, and check with explicit confirmation. LocalEngine tests cover wrong practice retry and first-try-only check scoring. |
| 5. Accessibility and presentation | Sequence buttons use the shared density target size and visible focus. A polite status region announces placement and Undo; component tests verify focus transfer. The shared reduced-motion rule removes reveal and wrong-answer animation. A local browser pass used Enter to place items and confirmed the remaining/placed lists, focus, Undo, feedback and completion. |
| 6. Gate and standalone demo | Compiler test rejects sequence when disabled; local demo test checks sequence-only enablement, profile filtering and disabled Spec 2 entries. Browser pass selected `Sequence · Spec 3` and completed the authored piece. |

## Verification run

- `pnpm test`: 109 tests across 11 files passed.
- `pnpm build`: TypeScript build and Vite production build passed.
- `uv run --with jsonschema --with pyyaml python scripts/check-content.py schema/story-schema-2.1.json content/manor/pumpkin-gate.story.yaml`: 0 problems.
- The same checker for `content/manor/core-preview.story.yaml`: 0 problems.
- Local browser: Daan sequence started with mixed order. Keyboard Enter placement retained focus on the next item. Placing all three items did not submit; Done produced practice feedback for a wrong order. Undo and corrected placement followed by Done completed the piece.

The browser pass exercised the standalone demo. It did not claim full fixed-profile lesson completion or Inspect support.
