# Spec 4 Inspect verification

Spec 4 implements the Inspect interaction in `feat/inspect-impl`, based on merged PR #21 (`dev` at `3695a08`). The local demo exposes the authored fictional message with `inspect` enabled independently. The existing lesson entry still opens the continue-only core preview; the Pumpkin Gate Engine path is verified separately.

| Requirement | Evidence |
|---|---|
| 1. Inspect schema and safety | Runtime and Story YAML schemas constrain message/page/sign, eight part roles, 3–8 unique nonblank parts, image alt text, and `minMarks` 0 through part count. Content validation checks answer IDs and minimums. The bundled message uses `coinz4u.example`; a fixture test rejects non-`.example` domains. |
| 2. Selection | `InspectView` renders document hierarchy and role styling. Each part is a toggle button with an accessible role/text name, `aria-pressed`, checkmark state, and polite count announcement. Link and button roles are display-only content; component tests find no outbound link. |
| 3. Submission | Done stays disabled below the minimum. `minMarks: 0` exposes “Nothing is wrong.” A seven-subset component sweep verifies document-order IDs and explicit-only submission. |
| 4. Shared modes and privacy | Player tests cover open, practice feedback/reveal and check confirmation with an empty answer. The compiler exposes only transformed practice `local.flagged`; a synthetic check test verifies no local answer and first-try scoring. The Engine rejects duplicate, unknown and below-minimum IDs, and compares practice sets exactly. |
| 5. Accessibility | Shared density and focus styles apply. Button semantics support pointer/touch and keyboard; browser Enter unmarked the focused part and the active focus remained on it. Selected state uses a checkmark and border/background cue. Shared reduced-motion CSS disables reveal and wrong-answer animation. Interaction stops current speech. |
| 6. Gate and demo | Compiler rejects Inspect when disabled. A demo test enables only Inspect and confirms the standalone entry. Local browser opened the authored piece, marked and unmarked, saw wrong feedback, then corrected marks and advanced. |

## Verification run

- `pnpm test`: 122 tests across 12 files passed.
- `pnpm build`: TypeScript and Vite production build passed.
- `scripts/check-content.py` through `uv` with `jsonschema` and `pyyaml`: 0 problems for both bundled stories.
- Local Playwright browser: Inspect entry, fictional message, active keyboard focus, `aria-pressed` state, minimum Done gate, wrong feedback, correction and progression. A review fix subsequently isolated the fixed-profile standalone preview to its Inspect piece; a regression test verifies it ends in “Piece complete” with Inspect enabled alone.
- A LocalEngine integration test traverses the fixed-profile Pumpkin Gate lesson through Inspect, assessment and result when all four core interaction flags are enabled.
