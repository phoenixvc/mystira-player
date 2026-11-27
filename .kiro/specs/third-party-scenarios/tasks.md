# Implementation Plan: Third-Party Scenario Embedding

All items are open. Spec 6 is an optional reusable-product track after the shared renderer and element contract exist; it is not part of the Kiroween interaction cap or the Blazor parity gate.

- [ ] 1. Freeze the portable integration contract.
  - [ ] 1.1 Define versioned package exports, runtime schemas, capability negotiation and compatibility policy.
  - [ ] 1.2 Define seat/role, current-participant permissions, session mode, waiting/aggregate/resolved states and ordered update revision.
  - [ ] 1.3 Define optional host update subscription and cleanup; preserve polling/refresh via `resumeSession` as fallback.
  - Requirements: 1–3

- [ ] 2. Implement action and synchronization behavior.
  - [ ] 2.1 Handle idempotent submissions, pending/accepted/rejected/resolved states, conflict refresh and out-of-order updates.
  - [ ] 2.2 Implement turn, facilitator and vote presentation while leaving quorum, deadlines, ties and branching to the host engine.
  - [ ] 2.3 Test two participants, duplicate taps, concurrent actions, late join, disconnect/reconnect and remount.
  - Requirements: 2–3

- [ ] 3. Make the element portable and extensible.
  - [ ] 3.1 Build a plain-HTML adapter/sample with no Mystira Identity, APIs or authored YAML.
  - [ ] 3.2 Add bounded, versioned host scene-stage and action extensions with typed unsupported fallback and no executable authored content.
  - [ ] 3.3 Test media ownership, captions/transcripts, focus, localization, reduced motion, cleanup and host URL/style isolation.
  - Requirements: 1, 4–5

- [ ] 4. Prove third-party use and publish guidance.
  - [ ] 4.1 Build a second, unrelated host sample and run a real two-client turn/vote browser flow.
  - [ ] 4.2 Document adapter recipes, transport ownership, security/privacy boundary, version upgrades and license/asset/brand terms.
  - [ ] 4.3 Record limitations and release evidence before claiming third-party multiplayer support.
  - Requirements: 1–5
