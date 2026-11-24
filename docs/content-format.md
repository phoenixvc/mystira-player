# Mystira Player: content format

| | |
|---|---|
| Status | v1.1, final, issued to the team |
| Date | 24 November 2026 |
| Format | Mystira story YAML, schema version `2.1` |
| Companion docs | [PRD](./prd.md) v0.8, [Technical Specification](./tech-spec.md) v1.5 |
| Full example | [`content/manor/pumpkin-gate.story.yaml`](../content/manor/pumpkin-gate.story.yaml), validated against the schema and every rule in section 10 |

> Public document. It describes how a story or lesson is written for the player. It does not describe how Mystira chooses what a child gets.

## 1. The rule

The player reads **Mystira's own story YAML**. There is one format for stories and lessons, not two.

Version `2.1` adds lessons, dialogue, 2D staging and two new interactions to the existing format. Every addition is optional, so:

- every existing Mystira story (version `1.0` or `2.0`) is valid `2.1` content and plays unchanged;
- a `2.1` file that uses none of the additions is a plain story;
- nothing that exists today is renamed, removed or given a new meaning.

Mystira stories also carry engine fields (developmental and progression data on branches and scenes). The player accepts them and ignores them. They are not described here, and demo content leaves them out.

**Required fields stay required.** The additions are optional, but every field the `2.0` format requires is still required in a `2.1` file (section 3). The snippets in sections 4 to 7 are excerpts that show only the new fields; copy the full example file, not a snippet, when starting a new lesson.

Names are `snake_case`, as in the existing format. Media fields hold a Mystira media id, or, in this repository, a path relative to the content file.

## 2. File layout

```
content/manor/
  hub.yaml                    the Manor front hall (player-only; not a story)
  pumpkin-gate.story.yaml     one lesson = one story file
  fire-door.story.yaml        stretch
  assets/                     images and audio, referenced by relative path
```

## 3. What a story already has

These fields exist in the current format and keep their meaning. The player uses the ones marked **used**.

Required on every file: `title`, `description`, `image`, `tags` (not empty), `difficulty`, `session_length`, `age_group`, `minimum_age`, `core_axes`, `archetypes` (not empty), `characters` (not empty), `scenes`.

Required on every scene: `id`, `title`, `type`, `active_character` (may be `null`), `description`, `next_scene` (may be `null`), `difficulty` (may be `null`), `media` with `image`, `audio` and `video` (each may be `null`), `branches` (may be `[]`) and `metadata` with `creative_instruction` (may be `null`). Every character needs `metadata` with `role`, `archetype`, `species`, `age`, `traits` and `backstory`; invent these for demo characters.

| Field | Player use |
|---|---|
| `schema_version` | **used**: `"2.1"` for files that use any addition |
| `title`, `description`, `image`, `tags`, `difficulty`, `session_length`, `archetypes` | catalogue only; required by Mystira's importer, so always fill them |
| `age_group`, `minimum_age` | **used**: `age_group` sets presentation density |
| `core_axes` | engine only; may be empty in demo content |
| `characters[]`: `id`, `name`, `image`, `audio`, `metadata` | **used**: `id`, `name`, `image` (portrait); `metadata` is required by the importer |
| `music_palette` | host only |
| `scenes[]`: `id`, `title`, `type`, `description`, `next_scene`, `active_character` | **used** |
| `scenes[].media`: `image`, `audio`, `video` | **used**: background, narration audio, video |
| `scenes[].narration_timestamps` | **used**: read-along highlight |
| `scenes[].music` (`profile` and the rest) | **used**: `profile` is passed to the host as a hint |
| `scenes[].branches[]`: `choice`, `next_scene`, `id` | **used**: one choice button per branch |
| `scenes[].objects[]`: `id`, `label`, `geometry` | **used**: tap targets (section 5) |
| `scenes[].branches[]`: `object_id`, `verb` | **used**: what tapping an object does |
| `scenes[].media.stage3d`, `model3d`, `roll_routes`, `echo_reveals`, rewind fields | not rendered by the player; a host that supports them handles those scenes |

How a scene becomes something on screen, with no additions at all:

| Scene | Player shows |
|---|---|
| `type: narrative` with `next_scene` | the scene and a Next button |
| `type: choice` with `branches` that have no `object_id` | the scene and one button per branch (2 to 4) |
| `type: choice` with `branches` that have an `object_id` | the picture with tap targets (section 5) |
| `next_scene: null` and no branches | an ending |
| `type: roll` or `special` | handed to the host as unsupported |

## 4. Additions in 2.1

All optional. The snippets below are excerpts: required fields that are not new are left out to keep them short.

**Quote text with `?`, `:` or `#` inside `{ }`.** `{ title: Who said it? }` does not parse; `{ title: "Who said it?" }` does. Outside braces, `title: Who said it?` is fine.

### Characters

```yaml
characters:
  - id: milo
    name: Milo
    image: assets/milo.webp
    audio: null
    voice: { pitch: 1.6, rate: 0.95 }   # NEW: speech fallback when there is no recorded audio
    colour: "#FF8DB8"                    # NEW: name and bubble colour in dialogue
    metadata: { role: [friend], archetype: [the_helper], species: human, age: 9, traits: [cheerful], backstory: "Kai's best friend." }
```

### Scenes

```yaml
  - id: who_said_it
    title: Who said it?
    type: choice
    description: Kai has news about a game that gives free coins.   # still the one-line summary
    active_character: kai
    lines:                                # NEW: dialogue, played in order; replaces description on screen
      - { speaker: kai,  text: "Milo! A video says this game gives everyone free coins!", audio: null }
      - { speaker: milo, text: "Who said that?" }
    task: { text: "Who told Kai about the coins?" }   # NEW: the instruction for the interaction
    cast:                                 # NEW: 2D staging, up to three
      - { character_id: kai,  slot: left,  pose: excited, reactions: [jump] }
      - { character_id: milo, slot: right, pose: thinking }
    overlays:                             # NEW: text placed on the picture
      - { id: badge, text: "FREE!", x: 0.62, y: 0.35, align: center, style: callout }
    media: { image: assets/yard.webp, audio: null, video: null }
    next_scene: null
    branches:
      - { id: video,  choice: "A video",   next_scene: how_do_they_know }
      - { id: friend, choice: "A friend",  next_scene: how_do_they_know }
      - { id: teacher, choice: "A teacher", next_scene: how_do_they_know, image: assets/teacher.webp }  # NEW: picture on a choice
    practice:                             # NEW: makes this a practice piece (section 6)
      answer: { branch: video }
      hint: { text: "Listen to Kai again. Where did he hear it?" }
      on_wrong: [{ text: "Not quite. Kai saw it somewhere." }]
      reveal_after: 3
    exit_allowed: false                   # NEW: whether the host may show an exit here
    host_slot: null                       # NEW: a slot the host may fill on this scene
```

`slot` takes `left`, `center` or `right`, the 2D subset of the existing `stage_slot` values. `reactions` takes `jump`, `startle` or `wave`; tapping the character plays one, and it never counts as an answer.

### Sequence and inspect

Choices and tap targets already exist in the format. The two interactions that do not are added as an `interaction` block on a `narrative` scene; the Next button is replaced by the interaction's Done button.

```yaml
  - id: how_know_teach
    type: narrative
    next_scene: what_do_they_want
    interaction:                          # NEW
      kind: sequence
      items:
        - { id: eye,  label: "I saw it myself",        image: assets/eye.webp }
        - { id: book, label: "I learned it from a book" }
        - { id: ear,  label: "Someone told me" }
    practice: { answer: { order: [eye, book, ear] }, hint: { text: "Which one is the surest?" } }

  - id: what_do_they_want
    type: narrative
    next_scene: who_else_says_it
    interaction:                          # NEW
      kind: inspect
      document:
        kind: message                     # message | page | sign
        title: "FREE COINS!!!"
        parts:
          - { id: sender, role: sender, text: "coinz4u.example" }
          - { id: body,   role: text,   text: "Everyone gets 1000 coins today only!" }
          - { id: link,   role: link,   text: "Tap here and type your password" }
          - { id: price,  role: price,  text: "Just R9.99 to unlock" }
      min_marks: 1                        # 0 adds a "Nothing is wrong" button
    practice: { answer: { parts: [link, price] }, hint: { text: "What do they want you to give them?" } }
```

Inspect documents use invented names, brands and `*.example` domains only.

## 5. Tap targets (hotspots)

A tap target is an existing scene **object** with a 2D box, plus a **branch** that says what tapping it does. This is the same model Mystira already uses for clickable objects in stories.

```yaml
  - id: how_know_find
    type: choice
    task: { text: "Tap the one who really saw it happen." }
    media: { image: assets/yard-crowd.webp, audio: null, video: null }
    objects:
      - id: crow
        label: The crow on the fence
        geometry: { bounds: [0.70, 0.10, 0.15, 0.20] }   # 2D: [x, y, width, height] as fractions of the picture
        reveal: { text: "The crow was right there!" }      # NEW: shown in place when tapped (practice only)
      - id: dog
        label: The sleeping dog
        geometry: { bounds: [0.10, 0.60, 0.20, 0.25] }
    branches:
      - { id: tap_crow, object_id: crow, verb: tap, choice: "The crow", next_scene: what_do_they_want }
      - { id: tap_dog,  object_id: dog,  verb: tap, choice: "The dog",  next_scene: what_do_they_want }
    practice: { answer: { object: crow }, hint: { text: "Who was close enough to see?" } }
```

- `geometry.bounds` is read as a 2D box when it has four numbers and no `anchor`. 3D content keeps using `anchor` and `position_offset`.
- `choice` on the branch is the accessible label and the keyboard name of the target.
- Targets are invisible on screen: finding them is the task. A tap on nothing says "Nothing here" and is not a wrong try.

## 6. Practice, open and check scenes

| A scene with | Is played as | Who judges |
|---|---|---|
| no `practice`, not in a check | **open**: any answer moves on | nobody |
| `practice` | **practice**: the player gives feedback each try | the player |
| listed as a question in `lesson.checks` | **check**: the child confirms with "That's my answer" | the engine |

A check scene never has `practice`, `task` or `reveal`; its answer lives only in the `lesson` block, which the engine strips before anything reaches the player.

## 7. The lesson block (NEW)

A lesson is a story file with a `lesson` block. The scenes stay in `scenes`; the block says how they form pieces, versions, checks and research.

```yaml
lesson:
  id: pumpkin_gate
  title: How do you know something is true?
  pieces:
    - id: who_said_it
      title: Who said it?
      scenes: [who_said_it]               # one version: the same for every child
    - id: how_do_they_know
      title: How do they know?
      versions:                           # several versions; an engine picks one per child
        - { id: find_in_picture, scenes: [how_know_find] }
        - { id: teach_in_order,  scenes: [how_know_teach] }
    - id: what_do_they_want
      title: What do they want?
      scenes: [what_do_they_want]
  checks:
    - id: day3
      title: Day 3 check
      questions:
        - id: q1
          scene: q1_free_coins            # a scene in scenes[]
          answer: { branch: who }         # branch | object | order | parts
          research: [q1_where, q1_find, q1_verify, q1_use]
    - id: day5
      questions: [...]                    # choices, plus one inspect question
  result:
    scene: gate_opens
    key: { label: The pumpkin key, image: assets/key-pumpkin.webp }
```

Research scenes are ordinary scenes with a `research` field:

```yaml
  - id: q1_where
    type: choice
    research: { step: where, source: { kind: character, label: Auntie Anna } }   # NEW; step: where | find | verify | use
    lines: [{ speaker: anna, text: "Where could we find out who made the video?" }]
    branches: [...]
```

Rules:

- A piece has either `scenes` (the same for every child) or `versions`, never both.
- Every scene id in `lesson` exists in `scenes`. Every `answer` names a branch, object or part of that scene.
- Check scenes keep `next_scene: null`; the engine decides what follows.

## 8. The demo block (NEW, player demo only)

Which version each child gets, in which order, and why, is decided by Mystira's engine in production and is never written in content. For the public demo, `LocalEngine` reads it from a `demo` block instead. Production engines ignore this block.

```yaml
demo:
  profiles:                               # invented children only
    - id: demo_lerato
      display_name: Lerato
      strengths: ["Helping others", "Noticing details", "Trying things out"]
      versions: { how_do_they_know: find_in_picture }
      order: fixed                        # fixed | child_chooses
      rationale:
        how_do_they_know: "Lerato notices details, so she finds who really saw it in the picture."
    - id: demo_daan
      display_name: Daan
      strengths: ["Helping others", "Explaining to others", "Making things"]
      versions: { how_do_they_know: teach_in_order }
      order: child_chooses
      rationale:
        how_do_they_know: "Daan likes explaining to others, so he puts the three ways of knowing in order."
```

A demo profile holds only these fields. No real child's name, record or answers, and no axis names or codes, appear in demo content.

## 9. The hub file (player only)

The Manor front hall is not a story, so it has its own small file.

```yaml
# content/manor/hub.yaml
id: manor
title: The Manor of Major Headaches
background: { image: assets/hall.webp, alt: "A front hall with five doors" }
doors:
  - { story: pumpkin-gate.story.yaml, label: The Pumpkin Gate, bounds: [0.05, 0.20, 0.16, 0.60], state: open }
  - { story: fire-door.story.yaml,    label: The Fire Door,    bounds: [0.25, 0.20, 0.16, 0.60], state: locked }
```

## 10. Validation

A Kiro hook and a CI step run `scripts/check-content.py schema/story-schema-2.1.json <file>` on every content file. It checks the `2.1` schema and these rules:

- the file is valid Mystira story content (required story fields present);
- every `lesson`, `practice`, `answer`, `object_id` and `cast` reference resolves;
- no check scene has `practice`, `task` or `reveal`;
- object and door boxes lie inside the picture and do not overlap;
- interactions are within their limits (choices 2 to 4, targets 2 to 6, sequence 3 to 5, inspect parts 3 to 8);
- any interaction the build does not support raises a warning, not a failure;
- demo profiles hold only the fields in section 8, and every version they name exists.

The schema in this repository is the **player view**: it accepts every Mystira story, describes the fields above, and accepts engine fields as opaque values. Mystira's own importer validates against the full schema, which this repository does not carry.
