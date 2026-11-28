# PRD 08: Bilingual learning layers

| | |
|---|---|
| Status | First demo slice implemented; teaching content needs Afrikaans-speaker and educator review |
| Date | 28 November 2026 |
| First content | The Mummy's Party, English and Afrikaans, opening and first fire-safety lesson piece |
| Technical spec | [Spec 8: bilingual learning layers](../.kiro/specs/bilingual-learning/requirements.md) |

## Purpose

A child can hear the same story idea in English and Afrikaans, see how selected phrases express that idea, and continue the story without losing their place. The bilingual tools are optional learning layers below the scene. They do not change an answer, score, profile, or engine transition.

## First slice

1. For every first-piece line that has both static clips, show an optional comparison panel with the English and Afrikaans text and independent replay controls. Opening video dialogue is excluded until it has paired recordings; the video retains its English audio and Afrikaans caption in the Afrikaans preview.
2. On selected lines in each child path, offer curated phrase links. A tap highlights the phrase in both sentences. The link uses a bidirectional arrow and an accessible text label. The links describe equivalent ideas, not automatic word-for-word translation.
3. Pilot word-level readalong on one Zoe line and one Max line in both languages, using timestamp data returned with regenerated static clips. Highlight only when the timing manifest matches the exact scene, text and clip file.
4. Keep the controls beneath the artwork and story dialogue. The child can open or close the panel, use it by keyboard, and continue the story at any time. Comparison audio stops when the line, scene or panel changes. No request to a voice service occurs during play.

### First-slice acceptance

- Both Zoe and Max can open the panel, replay English and Afrikaans clips, reveal a phrase pair, and continue normally.
- A comparison is shown only when both clip manifests match the current scene, line index and exact text. No panel appears on the opening video or a line without a trustworthy pair.
- A replay stops normal narration and cannot advance the scene or submit an answer.
- The two pilot lines highlight words in step with their own recorded clip; lines without verified timing remain readable without a moving highlight.
- The two languages are visibly and programmatically labelled; phrase meaning is available without relying on color or motion.
- The panel fits narrow screens and reduced-motion settings.

## Next slices

### Timed readalong

Extend verified word or phrase timing to the remaining recorded clips and bring it into the generic scene dialogue, including pause, resume and video handling. Validate the first-slice generated timestamps against English and Afrikaans recordings before turning this on broadly. The content schema already accepts `narration_timestamps`, but the current engine/player do not use it; the first slice uses a separate exact-clip timing manifest in the optional comparison panel. No estimated or evenly distributed word timings should be presented as exact.

### Sound and spelling

Offer **Sound it out** for a small, reviewed set of Afrikaans words: group letters by their spoken sounds, play each reviewed sound, blend the sounds, then replay the whole word. Offer **Spell** separately to hear letter names. Record or review sound clips explicitly; isolated speech synthesis and splitting a word recording may produce misleading sounds. Begin with words from the lesson, then test comprehension and usability with Afrikaans-speaking educators and children. The [IES foundational reading guide](https://ies.ed.gov/ncee/wwc/PracticeGuide/21) supports linking speech sounds to letters and blending them; Afrikaans-specific content needs its own review.

### Sentence building

Older children can move a few authored phrase cards into Afrikaans order and hear the completed sentence. The puzzle must have an authored solution and explanation, not a machine-generated word alignment. It stays optional and does not affect the fire-safety check.

## Authoring and accessibility

- Language pairs and phrase links are content-owned data. The first demo can use a fixture, but reusable player behavior must receive them as optional presentation data from its host or engine.
- Limit simultaneous visual layers: normal story by default, then comparison, then one selected phrase. Do not draw connectors over characters or safety targets.
- Use text labels, focus indicators, and a visible connection symbol alongside color. Respect reduced motion. Let the child mute or replay without changing story state.
- The player runs for all Mystira age groups; sound-out and sentence building need age-specific review rather than a global default.
- Keep generated audio and alignment as static resources. Never send a child-facing playback request to a TTS provider.

## Open review questions

1. Which first-piece phrases best teach useful language without distracting from the fire-safety objective?
2. Which Afrikaans spelling patterns and pronunciations should the first sound-out set use, and who signs them off?
3. Does a sentence-level language toggle work better than the two replay cards for young children?
4. Which measured outcomes matter: voluntary replay, comprehension, pronunciation, or ability to continue the story?
