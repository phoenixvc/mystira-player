---
inclusion: always
---

# Structure

```
.kiro/              steering/, specs/, hooks/
docs/               prd.md, tech-spec.md, content-format.md, kiro-writeup.md
index.html          Vite entry page (links manifest and icons)
public/             favicon.ico, icons/, manifest.webmanifest, config.json (runtime, not secret)
content/manor/      hub.yaml, pumpkin-gate.story.yaml, assets/
schema/             story-schema-2.1.json (player view of Mystira's story schema)
scripts/            check-content.py (content validation, used by the hook and CI)
src/
  app/              standalone shell: routes, providers, auth, demo controls
  element/          <mystira-player> definition, attribute/property/event wiring
  engine/           types.ts, local/, remote/
  schema/           node.ts, interactions.ts, story-yaml.ts (Zod; mirrors schema/story-schema-2.1.json)
  player/           Player root, Hub, SceneView, MediaStage, Dialogue, Characters,
                    Overlay, NotesPanel, EndView, ErrorView
  interactions/     Choices, Hotspots, Sequence, Inspect, shared/ (modes, feedback ladder)
  interactions/stretch/  Pattern, Keypad, Count (only if time allows)
  voice/            NarrationPlayer, SpeechVoice, Tones
  theme/            tokens, density, themes/manor, themes/mystira-{light,dark,bright}
tests/e2e/          Playwright
```

## Conventions

- One component per file; tests next to the code (`*.test.ts(x)`).
- TypeScript: 2-space indent, double quotes, semicolons.
- Commits: conventional commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
- Branches and pull requests go against `dev`. `main` receives only `dev`.
- Build output goes to `dist/`; never commit it.
