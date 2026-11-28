# Spec 5 legacy playback compatibility matrix

Snapshot: Mystira `origin/dev` `7ae1335e103fff11e75a0b4845245457005213b1`; Player `origin/dev` `05101ca87ca221ef61c488497eb01f901381cead` on 2026-11-28. See [source-audit.md](source-audit.md) for source paths. This matrix describes **end-to-end compatibility at that snapshot**, not isolated React features. A source test confirms old behavior; it does not establish new host parity. Since the snapshot, the custom element and player-side Blazor interop seam landed. The host wrapper, actual DTO mapping and signed-in playback proof remain open, so the end-to-end dispositions below have not changed.

Statuses: **supported** = playable through the same embedded Player and authorized host; **host-rendered** = intentionally retained in a connected host with a verified boundary; **unsupported** = required adapter, element, host or parity evidence is missing; **not applicable** = no equivalent working behavior to migrate. At the audited snapshot, no case could be marked supported or host-rendered because the custom element and Blazor adapter were not implemented. The newer player-side seams alone do not establish that parity.

| Case and fixture | Blazor result to preserve | Current disposition and owner | Evidence / next proof |
|---|---|---|---|
| Narrative and Continue — `Test-Story-6-9.yaml` narrative scenes; `SceneActionPanelTests.cs` | Render text/media and advance `NextSceneId`, or Finish when none | **unsupported end-to-end**; Player has standalone continue renderer; Spec 5 host adapter owns authorized progression | Player `src/engine/local/compiler.ts`, `src/player/Player.tsx`; old panel tests. Replay matched scene IDs in harness. |
| Branching choice — `glowdome-3d-stage-story.yaml` `explore_the_room`; `Test-Story-6-9.yaml` choice scenes | Preserve authored order, exact destination, zero-based displayed index, compass metadata and profile/guest/AI attribution | **unsupported end-to-end**; Player choice UI exists; host adapter owns branch map | `GameFlowService.HandleChoiceAsync`, `ValidateDisplayedChoiceIndex`; old panel tests. Replay branches and attribution. |
| Roll success/failure and invalid branches — `Test-Story-6-9.yaml` `roll_1_calm_witness`; [synthetic DTO fixture](fixtures/legacy-dto-cases.json) | Show target, one result, then route success to branch 0 / failure to branch 1; bad path falls back or completes | **unsupported**; Spec 5 roll capability and host engine | `RollScene.razor`, `NavigateFromRollAsync`; add ready/resolved, retry/remount and branch tests. |
| Video special endings — `Test-Story-6-9.yaml` `ending_1_good` through `ending_3_unsolved` | Show video and terminal Finish with one host finalization | **unsupported**; Spec 5 special classification and generic terminal | Old action panel/media code; replay each ending. Other special variants remain unclassified. |
| Image, video and audio-only — `SceneMediaDisplayTests.cs`; synthetic DTO fixture | Preserve media selection priority, protected URL resolution, CORS, playback and cleanup | **unsupported end-to-end**; Player media renderer exists, host resolver/audio owner absent | `SceneMediaDisplay.razor`, `SceneMediaResolverTests.cs`; harness with resolved URLs, failure and unmount. |
| `stage3d` characters/objects — `glowdome-3d-stage-story.yaml` | Render primary GLB with camera/animation/attachments and poster/fallback, retain scene continuity | **unsupported**; Spec 5 bounded host stage extension | `SceneMediaDisplay.razor`; Player compiler rejects 3D-only scene. Harness with real host renderer. |
| `model3d` reference — synthetic DTO fixture; `SceneMediaDisplay.razor` | Use `Model3D.AssetId` when no stage character/object has priority | **unsupported**; Spec 5 host stage extension | DTO shape is source-based; find representative authored/live fixture and test resolution. |
| App-domain and numeric types — `SceneTypeMapperTests.cs`; synthetic DTO fixture | Recognize canonical 0–15 values (2 aliases Choice/Decision) and four StoryGenerator labels | **unsupported**; Spec 5 explicit adapter table | Old mapper tests cover numeric strings/names. Capture sanitized actual API payload; raw numeric token deserialization unverified. Unknown must yield typed unsupported in new adapter. |
| Narration timing, Markdown and word seek — synthetic DTO fixture | Preserve text, timestamps, host play/seek/highlight, ducking and sound cues | **unsupported**; Spec 5 audio bridge and Read to Me pilot `940cae5e` | `GameSessionPage.HandleWordTapped`; Player schema has `wordTimings`, but local compiler drops authored timing. Test seek, interruption, silence and remount. |
| Session start, pause/resume, AI turns, exit, awards — synthetic DTO fixture; `GameSessionServiceTests.cs` | Authoritative session ID/status/current scene, assignments, paused state, one finalization and awards route | **unsupported**; Blazor host owns authority, Spec 5 adapter owns bridge | Source services/page; signed-in tests and duplicate-submission controls. |
| Generic terminal — `SceneActionPanelTests.cs` null/empty next ID and completed session | Finish with no active Next; completion and awards once | **unsupported**; Spec 5 terminal node and host finalization | Existing Player result node is assessment-specific. Test no-forward, completed and remount. |
| Visible Rewind — `GameSessionPage.HandleRewind` | No scene change; handler is a no-op | **not applicable** as playback parity; adapter reports `canGoBack=false` | Add host checkpoint contract before claiming functional Back. |

## Raw scene type inventory

`Models/Scenario.cs` maps the values below; `SceneTypeMapperTests.cs` pins the numeric **string** and named mappings. `SceneActionPanel.razor` renders valid Choice and Roll specially, applies terminal detection first, and otherwise shows generic Continue. This describes the old action panel only; it does not prove that all named types carry ordinary narrative semantics. Every value is **unsupported end-to-end** until its behavior is classified in a fixture and the adapter is tested. The adapter must retain the original name or number for diagnostics.

| Value | App-domain name | Old action-panel bucket |
|---|---|---|
| 0 | Standard | Continue or Finish |
| 1 | Intro | Continue or Finish |
| 2 | Decision / Choice | Choices when valid branches exist; otherwise Continue or Finish |
| 3 | Action | Continue or Finish |
| 4 | Dialogue | Continue or Finish |
| 5 | Puzzle | Continue or Finish |
| 6 | Exploration | Continue or Finish |
| 7 | EchoReveal | Continue or Finish |
| 8 | Ending | Continue or Finish |
| 9 | Checkpoint | Continue or Finish |
| 10 | Cutscene | Continue or Finish |
| 11 | MiniGame | Continue or Finish |
| 12 | Tutorial | Continue or Finish |
| 13 | Narrative | Continue or Finish |
| 14 | Roll | Roll control, then Continue after result |
| 15 | Special | Continue or Finish; inspected YAML examples are video endings |

StoryGenerator labels `narrative`, `choice`, `roll`, and `special` enter the corresponding buckets. Empty and unknown strings or numbers fall back to Narrative in the current Blazor mapper; the new adapter must report typed unsupported so a novel behavior is not silently reinterpreted.

## Fixture and gate ledger

- **Repository-authored YAML:** `mystira-workspace/apps/story-generator/tests/Mystira.StoryGenerator.Application.Tests/Mystira.StoryGenerator.Application.Tests/test_data/Test-Story-6-9.yaml` covers branching, roll and six special video endings. `apps/story-generator/test-data/glowdome-3d-stage-story.yaml` covers stage3d. These are committed test content at the source revision above.
- **Source-shaped DTO cases:** [fixtures/legacy-dto-cases.json](fixtures/legacy-dto-cases.json) is synthetic, non-sensitive planning data derived from `Models/Scenario.cs`. It is **not** an API capture or a new runtime contract. It pins candidate raw type, branch, media and session cases for adapter tests.
- **Missing acceptance inputs:** sanitized actual API/DTO responses after the Blazor deserializer, an authored `model3d` case, other deployed `special` behaviors, a real Blazor harness and signed-in story replay. These must be gathered before the matrix is frozen or a blanket compatibility claim is made.
- **Release wording now:** the standalone Player supports its authored Kiroween format and four core interactions. It has not been proven compatible with existing Mystira Blazor story playback.
