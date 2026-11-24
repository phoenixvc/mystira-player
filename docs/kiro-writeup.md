# How we used Kiro

A running log, kept from the first day of the build. Each entry says what we did in Kiro and what it changed.

## Steering

Four steering files in `.kiro/steering/`, included in every request:

- `product.md`: what the player is, the Manor entry, the four core interactions and the cut order.
- `tech.md`: the stack, the rule that the engine decides and the player only renders, the three modes, exact identifier names.
- `structure.md`: folder layout and conventions.
- `content.md`: the story YAML 2.1 rules and the command that validates every content file.

## Hooks

| Hook | Trigger | What it prevented |
|---|---|---|
| Validate story content | `content/**/*.yaml` saved | _to fill in_ |

## Specs

| Spec | What the requirements or design caught |
|---|---|
| 1. Player core | _to fill in_ |
| 2. Choices and hotspots | _to fill in_ |
| 3. Sequence | _to fill in_ |
| 4. Inspect | _to fill in_ |

## MCP

- **context7** (committed in `.kiro/settings/mcp.json`): current library documentation for React 19, Vite, Zod and TanStack while generating designs and code.
- **[Baton](https://baton.celladoresystems.com)** by Celladore Systems (user-level settings, private): the shared task graph. Each spec's tasks were tracked in Baton, so work stayed visible across Kiro sessions and between the two of us. _Screenshot to add._
- **Mill** by Celladore Systems (user-level settings, runs locally): image conversion for the Manor art, for example PNG to WebP at web quality.
- **Mystira workspace** (user-level settings, private): project context from the Mystira platform.

The private servers live in user-level settings because their addresses are internal; only context7 is committed.

## Notes for the video

_Moments worth showing, added as they happen._
