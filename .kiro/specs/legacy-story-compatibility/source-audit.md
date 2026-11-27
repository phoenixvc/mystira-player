# Legacy Blazor source audit (2026-11-28)

This is the specification coverage audit, not the fixture-backed compatibility matrix required by task 1. Current evidence is the `mystira-workspace` checkout; task 1 must refresh it against the integration branch and supply non-sensitive fixtures and tests. Every row below is specified, but implementation and parity remain open.

| Current Blazor behavior | Source | Spec 5 owner and acceptance |
|---|---|---|
| Scene type mapping: StoryGenerator `narrative`, `choice`, `roll`, `special`; app-domain names and numeric 0–15, including the `Choice`/`Decision` alias | `apps/app/src/Mystira.App.PWA/Models/Scenario.cs`, `Scene.SceneType` and `SceneType` enum | Adapter: explicit mapping, raw-type diagnostics, unsupported on unknown behavior; fixture per value and behavior |
| Narrative/choice/roll/special action selection, terminal Finish, missing branch handling | `Pages/GameSession/SceneActionPanel.razor`; `Services/GameFlowService.cs`; `Services/GameSessionService.cs` | Player stage and host engine: matched old/new transitions, rolls and terminal paths |
| Branch destination, authored order, displayed index, compass effects and player attribution from active character assignment | `Models/Scenario.cs`, `SceneBranch`, `Choice`, `ChoiceSelection`; `Services/GameFlowService.cs`, `HandleChoiceAsync` | Adapter retains exact branch; host flow validates displayed index and records compass/attribution |
| Profile/guest/AI character assignments, active speaker portrait, player rail, AI turns | `Pages/GameSessionPage.razor`; `Services/GameFlowService.cs`, `HandleChoiceAsync` | Host owns assignments, rail and AI actions; player renders speaker/portrait and blocks human action on AI turn |
| Markdown story text, timed narration highlighting and word-tap seek | `Pages/GameSessionPage.razor`, `MarkdownRenderer`, `PlayAudio`, `HandleWordTapped` | Player text/timing UI with host audio bridge; seek/highlight and fallback acceptance |
| Image, video, audio, `stage3d`, `model3d`, media action and fallback | `Pages/GameSessionPage.razor`, `SceneMediaDisplay`; `Models/Scenario.cs`, `SceneMedia` | Player stage plus host 3D extension and media resolver; focus, fallback and cleanup tests |
| Scene music, sound effects, first-gesture unlock, narration ducking, pause/mute/volume | `Pages/GameSessionPage.razor`, `SceneAudioOrchestrator` | Host audio owner with one narration owner per scene; audio lifecycle tests |
| Start/resume, loading/empty state, pause/resume, navigation confirmation, exit and route | `Pages/GameSessionPage.razor`; `GameSessionService`; `GameFlowService` | Host owns session/page chrome; player resumes authorized scene without changing URL |
| Visible Rewind control | `Pages/GameSessionPage.razor`, `HandleRewind` | Current handler is a no-op. Host reports `canGoBack=false` until checkpoint support exists; no parity claim for rewind |
| Keyboard shortcuts, drawer/exit precedence, text size, theme and scene atmosphere | `Pages/GameSessionPage.razor`, `HandleGlobalKeyDown`, `HandleTextSizeChanged`, `OnThemeChanged` | Host chrome/settings and player focus/theme contract; keyboard and visual acceptance |
| AI guide/commentary, inventory/journal/roll rail | `Pages/GameSessionPage.razor`, `AiNarratorPanel`, `InventoryJournalRail` | Host-owned services and chrome, synchronized from authoritative session; no duplicate element UI |
| Finish, session finalization, recap, badges/awards, guest and age eligibility | `Pages/GameSessionPage.razor`, `FinishAdventure`; `Services/GameFlowService.cs`, `FinishAdventureAsync` | Host-owned one-time finalization and awards navigation; player terminal signal only |

Before defaulting the host flag, task 1 must expand this into a case-by-case matrix with fixture, old/new outcome, owner and test evidence. The current player cannot yet make a full Blazor playback compatibility claim.
