# Spec 8: Design

## Existing slice and ownership

The demo currently supplies an optional English/Afrikaans pair lookup to `Player`; `LanguageExplorer` renders the comparison and its static replays. Mummy's Party builds the lookup from authored content and an exact-clip timing manifest. This is the baseline to verify in task 0, not a generic content contract or educator acceptance claim. The Engine still owns the current Step and progression; the learning layer observes its scene and line and cannot submit an Answer.

The data path for the reusable design is:

```text
authored language resources -> host or Engine presentation adapter
                           -> optional pair for current Step and line
                           -> comparison, phrase, readalong controls
story Answer and transition -> Engine only
```

## Presentation contract

Define a versioned optional presentation record keyed by scene ID and line index. It contains each locale's exact displayed text and static clip identity, curated phrase spans with a shared connection ID, and optional timing data tied to the clip. Validate lengths, span boundaries, uniqueness and resource references at import. At render, compare the record with the active Step text and clip identity; a mismatch suppresses the relevant layer. The host may supply records without depending on Mummy's Party fixture code. A later Story YAML representation should be mapped into this record by an adapter; do not make a schema change until task 0 freezes the format.

Only one audio owner plays at a time. Starting a comparison replay stops scene narration; closing the panel or moving to another line or scene cancels playback and clears the highlight. Replay never calls `Engine.answer` or `Engine.next`. Mute and failed playback preserve readable text and normal navigation. Opening video stays outside pair lookup until paired clips and timing have their own verified mapping.

## Layer layout

Keep story dialogue and interaction controls in their existing places. Place the optional comparison control below the scene/dialogue area, with two language-labelled replay cards. Expanding a curated phrase gives one connection at a time using a visible connection symbol, text label and focus treatment. Do not draw arrows over artwork or target regions. On narrow screens, stack the language cards and keep the story's Next/choice controls reachable without scrolling through a long exercise.

## Timing and later learning tools

Use recorded clip time as the source for readalong. A timing record binds the scene, line, locale, exact text and clip identity; highlight only while the corresponding clip is active. Validate monotonic non-overlapping ranges inside clip duration where duration is known. On seek, pause or resume, derive the active span from current playback time instead of running a separate guessed timer. The existing `narration_timestamps` authoring field is currently schema validated but not rendered by the generic player; mapping it requires an explicit implementation and tests.

Sound it out uses educator-reviewed grapheme groups and separate sound assets, then a whole-word clip. Spell uses reviewed letter-name assets. Sentence building uses authored cards, accepted order and explanation. Both are optional presentation exercises, independently enabled after age and content review; neither changes the Engine's fire-safety check state.

## Verification boundary

Task 0 first records current demo evidence and gets product, Afrikaans-speaker and educator decisions on phrases and pronunciation. Implementation tasks then establish the reusable contract, extend verified readalong, and add reviewed exercises one layer at a time. Tests cover pure validation and playback lifecycle; a browser pass checks both child paths, desktop and narrow layouts, keyboard, mute and reduced motion. Report implementation, pedagogical review and host acceptance separately.
