---
inclusion: always
---

# Content

Full guide: `docs/content-format.md`. Start new content from a copy of `content/manor/pumpkin-gate.story.yaml`, never from a snippet.

## The format

- Content is **Mystira's own story YAML, `schema_version: "2.1"`**. There is one format for stories and lessons. Do not invent another, and do not add fields that are not in `schema/story-schema-2.1.json`.
- Every 2.1 addition is optional, but every field the 2.0 format requires stays required: on every scene, `active_character`, `difficulty`, `media` (`image`, `audio`, `video`), `branches` and `metadata.creative_instruction`, even when `null` or `[]`.
- A lesson is a story file with a `lesson` block (pieces with `scenes` or `versions`, checks, result). Check answers live only in the `lesson` block.
- A check scene never has `practice`, `task` or `reveal`.
- Tap targets are scene `objects` with `geometry.bounds: [x, y, w, h]` (fractions of the picture) plus a branch with `object_id`.
- The `demo` block is for `LocalEngine` only; a demo profile holds only `id`, `display_name`, `strengths`, `versions`, `order`, `rationale`.
- Engine fields (compass and progression data) are accepted and ignored. Never write rules or meanings for them.
- In YAML, quote any text containing `?`, `:` or `#` inside `{ }`.

## Rules for anything written into content

- Invented names only. No real child's name, record or answers.
- Inspect documents use invented brands and `*.example` domains only.
- Language for 6 to 9 year olds; one decision per screen.

## Validate every change

```bash
python3 scripts/check-content.py schema/story-schema-2.1.json <file>
```

It must report `0 problem(s)`. Fix the file, not the checker. If the checker or schema seems wrong, stop and say so.
