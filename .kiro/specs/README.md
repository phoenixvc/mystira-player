# Player Specification Map

The core interaction scope is divided into four Kiro specs, matching the product requirements and interaction cut order. Separate Kiro specs cover legacy-story compatibility and third-party scenarios; they do not add interaction families.

| Order | Spec | Owns |
|---|---|---|
| 1 | player-core | App/toolchain, shared node and Engine contracts, continue-only LocalEngine path, scene renderer, Next/Back and shared presentation/audio/theme/demo capabilities. |
| 2 | choices-hotspots | Choice/hotspot schema, rendering and Engine behavior; shared open/practice/check modes and feedback; check confirmation; assessment/research/result flow. |
| 3 | sequence | Sequence schema, Engine contract and renderer; open/practice/check behavior using Spec 2 shared machinery. |
| 4 | inspect | Fictional mock message/page/sign content, inspect schema, Engine contract and renderer; open/practice/check behavior using Spec 2 shared machinery. |

Pattern, keypad and count are the approved post-core product target under [PRD 07](../../docs/prd-07-seven-interactions.md) and [Spec 7](seven-interactions/requirements.md). The current contest gate remains the four core types, with inspect cuttable under the primary PRD.

## Supporting specs outside the four interaction families

- [Legacy story compatibility](legacy-story-compatibility/requirements.md) covers compatibility with existing Mystira story content.
- [Third-party scenarios](third-party-scenarios/requirements.md) covers portability and host integration.

## Cross-spec rules

- Core defines shared node and Engine contracts.
- A node carries at most one interaction.
- Spec 2 introduces shared practice/check behavior; sequence and inspect reuse it.
- The Engine decides correctness and progression; the Player renders and submits stable answers.
- The Player never branches on child identity.
- Each interaction family owns its schema, Engine behavior and renderer.
