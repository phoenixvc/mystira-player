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

The opening and first lesson piece have pre-generated English and Afrikaans narration for both Zoe and Max (20 clips per language). The static MP3s are under `public/mummys-party/audio/{en,af}/`; playback makes no ElevenLabs request. Open `?story=mummys-party&lang=af` for the Afrikaans first-lesson preview. It ends after the first piece, while the English path continues through the full draft. The opening video still has English audio; the Afrikaans line is displayed as a caption.

On recorded first-piece lines, **Compare English and Afrikaans** opens paired text and replay controls without advancing the story. Curated phrase links on selected Zoe and Max lines show matching ideas; four static clips (one line per path in each language) also have exact word timing for readalong during comparison replay. See [PRD 08](docs/prd-08-bilingual-learning.md) for the broader sound-out, spelling and sentence-building design. `node scripts/generate-mummys-party-timing.mjs` previews missing timing clips; `pwsh -NoProfile -File scripts/generate-mummys-party-timing.ps1` uses the same local restricted credential to generate only missing pilot timing assets.

`node scripts/generate-mummys-party-voices.mjs --locale=en` or `--locale=af` previews the exact scene count, clips and new character count without using a key. To generate missing clips, save a restricted ElevenLabs Text to Speech key as a DPAPI `PSCredential` in `%USERPROFILE%\.mystira-elevenlabs.xml`, then run `pwsh -NoProfile -File scripts/generate-mummys-party-voices.ps1 -Locale en` or `-Locale af`. English uses `eleven_multilingual_v2`; Afrikaans uses `eleven_v3`. Existing clips are reused, and each manifest matches clips to authored text so changed lines do not silently play stale audio. The key stays outside the repository and browser bundle. Review the recorded voices before extending `pieceCount` in `scripts/mummys-party-voices.config.json` and `scripts/mummys-party-voices.af.config.json`.

The current English draft uses a European setting for its 112 emergency-number exercise. A release for another location needs its own verified emergency-number copy and an educator review before translation or voice generation. The smoke escape copy follows [US Fire Administration guidance](https://www.usfa.fema.gov/prevention/home-fires/at-risk-audiences/children/index.html) to stay low and move to an exit; it does not describe air near the floor as safe. The [European Commission's 112 guidance](https://digital-strategy.ec.europa.eu/en/policies/112) explains that 112 reaches emergency services throughout the EU.

Open `http://127.0.0.1:5173/?media=mummys-party` to browse all 77 draft YAML scenes, rough sample arrangements, and both videos. Positions remain provisional: the one-second [opening](docs/media-analysis/opening-video-seconds.jpg) and [closing](docs/media-analysis/closing-video-seconds.jpg) video contact sheets and the 77-scene [layout overview 1](docs/media-analysis/screen-layouts-overview-11.png) and [layout overview 2](docs/media-analysis/screen-layouts-overview-21.png) informed staging, but the YAML has no structured per-scene layer coordinates. The assets came from the **Media** section of the [Mummy's Party Notion page](https://app.notion.com/p/4237ad2bc5d681b4a68ee4d341d683e6); the outer `.zip.zip` contains the 61-file asset ZIP, and the videos were supplied separately. The YAML and notes supplied separately are copied under `content/manor/`. Their `assets/` paths map to `public/mummys-party/`. The voice-only fire-service character has `image: null` because the referenced `operator.webp` was not supplied.

## Built with

- [Kiro](https://kiro.dev): specs, steering and hooks (see [docs/kiro-writeup.md](docs/kiro-writeup.md)).
- [Baton](https://baton.celladoresystems.com) and [Mill](https://mill.celladoresystems.com) by [Celladore Systems](https://celladoresystems.com), connected to Kiro over MCP: Baton for the shared task graph, Mill for image conversion.

## Licence

Code: [Apache-2.0](LICENSE). Story text, pictures and audio under `content/`: all rights reserved, included for running and judging. Names and trademarks are not licensed. See [NOTICE](NOTICE).
