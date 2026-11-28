# Spec 8: Bilingual learning layers

## Boundary and status

This requirements-first spec turns [PRD 08](../../../docs/prd-08-bilingual-learning.md) into an implementable plan. The first English/Afrikaans comparison slice exists in the Mummy's Party demo, but its teaching content still needs an Afrikaans speaker and educator review. The [design](design.md) describes the reusable boundary and [tasks](tasks.md) begin with task 0, a content and contract review. Future layers below are targets, not shipped claims.

The learning layer is optional presentation. It SHALL not choose a story branch, answer an interaction, score a check, alter a child profile or change an Engine transition. Story dialogue and safety prompts remain available when the layer is closed, muted, missing or invalid.

## Requirements

### S8-1: Trustworthy bilingual pairs

1. A comparison SHALL appear only when both English and Afrikaans records match the current scene ID, line index, exact displayed text and static clip identity. A missing or mismatched pair SHALL leave ordinary story playback intact.
2. The panel SHALL label both languages in visible text and programmatically. Each clip SHALL have an independent replay control. Replay SHALL stop ordinary narration, and changing line, scene or panel state SHALL stop comparison audio.
3. Opening video SHALL not show a comparison until it has verified paired recordings. Existing video captions and audio behavior SHALL remain usable.
4. Comparison playback SHALL use prebuilt static resources; child-facing playback SHALL make no voice-service request.

### S8-2: Curated phrase connections

1. A content author SHALL identify selected phrase spans and their equivalent ideas in both languages; the player SHALL not generate a word-for-word alignment.
2. Activating a phrase SHALL identify the connected phrases in text and through an accessible connection label as well as any visual treatment. Only one phrase connection SHALL be emphasized at a time.
3. Phrase controls SHALL remain below the scene, away from characters, choice targets and fire-safety hazards, and SHALL not block story continuation.

### S8-3: Verified readalong

1. Timed highlighting SHALL use word or phrase timestamps verified against the exact text and recorded clip. An absent, mismatched or unverified timing record SHALL render readable text without a moving highlight.
2. Pause, resume, replay, mute, line change and scene change SHALL keep the highlight synchronized with the active audio or clear it. Video dialogue SHALL enter readalong only after a separately verified caption/audio timing contract.
3. The initial Zoe and Max pilot SHALL be visually checked in both languages before timing expands to remaining recorded clips or generic dialogue.

### S8-4: Reviewed sound and spelling

1. A small Afrikaans vocabulary set MAY offer separate **Sound it out** and **Spell** actions. Sound it out SHALL use reviewed sound groups, sound clips, blend order and a whole-word replay; Spell SHALL use reviewed letter names.
2. The player SHALL not infer phonemes by slicing whole-word audio or synthesize isolated sounds during playback. Missing reviewed assets SHALL hide the action or provide plain text, never a guessed pronunciation.
3. An Afrikaans-speaking educator SHALL approve the first content set and age presentation before the feature is enabled for a child-facing demo.

### S8-5: Optional sentence building

1. For an age-reviewed older-child path, authored phrase cards MAY be reordered into Afrikaans sentence order, with an authored solution and explanation and replay of the completed sentence.
2. This exercise SHALL be skippable and SHALL not affect the fire-safety check, normal story progress or Engine answer submission.

### S8-6: Host contract and accessibility

1. A reusable player SHALL receive optional language pairs, phrase links, timing and sound/spelling data through a documented presentation contract. The Mummy's Party fixture SHALL not become a required runtime dependency.
2. The default view SHALL remain the story. Comparison and one selected phrase are the maximum simultaneous learning layers. Controls SHALL work with touch, pointer and keyboard, show focus, respect reduced motion, and communicate state without color or sound alone.
3. An unsupported locale, invalid resource or failed audio play SHALL leave the scene and story controls usable. Learning actions SHALL emit no raw child speech, phonetic attempt or answer telemetry.

### S8-7: Acceptance

1. Both Zoe and Max SHALL complete the first lesson piece with the panel opened and closed, independent language replays and a phrase link, without a changed Engine transition or answer.
2. Tests SHALL cover exact-match gating, stale or missing clip and timing data, audio cleanup, keyboard and narrow-screen operation, mute and reduced motion. Visual review SHALL cover overlap with dialogue and interaction controls.
3. Afrikaans teaching content SHALL have a recorded speaker/educator review before it is described as pedagogically accepted. Release notes SHALL distinguish the current comparison demo from timed readalong, sound/spelling and sentence-building coverage actually verified.
