# Spec 8: Tasks

The first Mummy's Party comparison demo exists. Checkboxes below describe the remaining evidence or work; none is checked merely because the PRD describes it.

- [ ] 0. Review and freeze the first bilingual teaching and presentation contract.
  - [ ] 0.1 Reproduce the current Zoe and Max first-piece paths in both languages; record exact scene/line/clip coverage, the two pilot timing lines, missing pairs and current host coupling.
  - [ ] 0.2 Ask an Afrikaans speaker and educator to review selected phrase meanings, written text, pilot timing and age fit. Record decisions and owners for open PRD 08 questions; keep unreviewed material labelled as a demo.
  - [ ] 0.3 Freeze the optional versioned pair/phrase/timing record and exact-match fallback, with the Engine transition and answer boundary explicit. Record whether the first reusable source is host data or Story YAML before changing either contract.
  - Requirements: S8-1, S8-2, S8-3, S8-6, S8-7
- [ ] 1. Verify and harden the existing comparison slice.
  - [ ] 1.1 Test both child paths, pair gating, phrase connection, independent replays and audio cancellation without story progression.
  - [ ] 1.2 Review desktop and narrow layouts, keyboard focus, mute and reduced motion; fix any dialogue, target or control overlap.
  - Requirements: S8-1, S8-2, S8-6, S8-7
- [ ] 2. Make bilingual presentation data reusable across hosts.
  - [ ] 2.1 Validate and document optional pair, phrase and timing records; adapt the demo fixture without requiring it in the player package.
  - [ ] 2.2 Prove a second host can provide the same record and that missing or invalid data leaves ordinary playback intact.
  - Requirements: S8-1, S8-2, S8-6
- [ ] 3. Extend verified readalong.
  - [ ] 3.1 Visually verify Zoe and Max pilot timestamps against their exact English and Afrikaans clips; reject stale or approximate timings.
  - [ ] 3.2 Map verified timestamps into remaining recorded clips and generic dialogue, with pause/resume/replay/line-change cleanup. Treat video separately when paired recordings and timing exist.
  - Requirements: S8-3, S8-7
- [ ] 4. Add reviewed sound and spelling for a small Afrikaans set.
  - [ ] 4.1 Author and approve sound groups, separate sound and letter-name clips, blend order and whole-word replay with an Afrikaans-speaking educator.
  - [ ] 4.2 Build optional Sound it out and Spell controls and verify unavailable-asset, age, keyboard and mute behavior.
  - Requirements: S8-4, S8-6, S8-7
- [ ] 5. Pilot optional sentence building for an older-child path.
  - [ ] 5.1 Author phrase cards, accepted order, explanation and replay; get age and language review.
  - [ ] 5.2 Verify skip/continue and that the exercise never affects a fire-safety answer or Engine transition.
  - Requirements: S8-5, S8-6, S8-7
- [ ] 6. Publish acceptance evidence and the exact supported-layer matrix.
  - [ ] 6.1 Run focused validation, component and browser checks for both languages and child paths, including a second-host pass.
  - [ ] 6.2 Record implementation, educator and host acceptance separately; describe only verified layers as supported.
  - Requirements: S8-7
