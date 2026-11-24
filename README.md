# mystira-player

An open-source player for Mystira stories, lessons and assessments, for every Mystira age group. It runs on its own or inside a host app as a `<mystira-player>` element. Our Kiroween 2026 entry, "The Manor of Major Headaches", is built on it.

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
