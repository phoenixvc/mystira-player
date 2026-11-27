<p align="center"><img src="public/icons/icon-192.png" width="128" height="128" alt="Mystira logo"></p>

# mystira-player

An open-source player for Mystira stories, lessons and assessments, designed for every Mystira age group. The planned delivery includes a standalone app and an embeddable `<mystira-player>` element. The current foundation branch has a continue-only local preview; the full renderer, interactions, and element are still in the [Kiro task plans](.kiro/specs/README.md). Our Kiroween 2026 entry, "The Manor of Major Headaches", is being built on it.

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

## Built with

- [Kiro](https://kiro.dev): specs, steering and hooks (see [docs/kiro-writeup.md](docs/kiro-writeup.md)).
- [Baton](https://baton.celladoresystems.com) and [Mill](https://mill.celladoresystems.com) by [Celladore Systems](https://celladoresystems.com), connected to Kiro over MCP: Baton for the shared task graph, Mill for image conversion.

## Licence

Code: [Apache-2.0](LICENSE). Story text, pictures and audio under `content/`: all rights reserved, included for running and judging. Names and trademarks are not licensed. See [NOTICE](NOTICE).
