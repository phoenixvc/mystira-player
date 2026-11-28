<p align="center"><img src="public/icons/icon-192.png" width="128" height="128" alt="Mystira logo"></p>

# mystira-player

An open-source player for Mystira stories, lessons and assessments, designed for every Mystira age group. The standalone demo opens the five-piece Pumpkin Gate lesson for both invented profiles, with a separate assessment entry. It falls back to the continue-only core preview when one of the four core interactions is disabled. The [embeddable `<mystira-player>` element](docs/element-host.md) now has a plain HTML host example; the Blazor bridge remains in the [Kiro task plans](.kiro/specs/README.md).

## Docs

| Document | What it covers |
|---|---|
| [PRD](docs/prd.md) v0.8 | What we are building for Kiroween, for whom, scope and cut order, milestones |
| [Technical specification](docs/tech-spec.md) v1.5 | Architecture, node and engine model, embedding contract, API contract, testing, Kiro usage |
| [Content format](docs/content-format.md) v1.1 | How to write a story or lesson: Mystira story YAML 2.1 |

## Content

- `content/manor/pumpkin-gate.story.yaml`: the full example lesson. Start new lessons from a copy of it.
- `schema/story-schema-2.1.json`: the player view of Mystira's story schema.
- Check a content file:

  ```bash
  pip install pyyaml jsonschema
  python3 scripts/check-content.py schema/story-schema-2.1.json content/manor/pumpkin-gate.story.yaml
  ```

All names and children in demo content are invented.

## Mummy's Party media preview

Run `pnpm dev` and open `http://127.0.0.1:5173/?story=mummys-party` to play the draft fire-safety lesson with Zoe or Max and its separate assessment. The player uses the supplied YAML, opening and closing videos, character poses, layered props, and ghost glow SVGs. Choose **Lesson** and **Start lesson** to begin at the opening video; the other entry points let you inspect a lesson piece or the assessment directly.

Open `http://127.0.0.1:5173/?media=mummys-party` to browse all 77 draft YAML scenes, rough sample arrangements, and both videos. Positions remain provisional: the one-second [opening](docs/media-analysis/opening-video-seconds.jpg) and [closing](docs/media-analysis/closing-video-seconds.jpg) video contact sheets informed the first staging pass, but the YAML has no structured per-scene layer coordinates. The assets came from the **Media** section of the [Mummy's Party Notion page](https://app.notion.com/p/4237ad2bc5d681b4a68ee4d341d683e6); the outer `.zip.zip` contains the 61-file asset ZIP, and the videos were supplied separately. The YAML and notes supplied separately are copied under `content/manor/`. Their `assets/` paths map to `public/mummys-party/`. The voice-only fire-service character has `image: null` because the referenced `operator.webp` was not supplied.

## Built with

- [Kiro](https://kiro.dev): specs, steering and hooks (see [docs/kiro-writeup.md](docs/kiro-writeup.md)).
- [Baton](https://baton.celladoresystems.com) and [Mill](https://mill.celladoresystems.com) by [Celladore Systems](https://celladoresystems.com), connected to Kiro over MCP: Baton for the shared task graph, Mill for image conversion.

## Licence

Code: [Apache-2.0](LICENSE). Story text, pictures and audio under `content/`: all rights reserved, included for running and judging. Names and trademarks are not licensed. See [NOTICE](NOTICE).
