import manifest from './mummysPartyVoiceManifest.json';

type VoiceLine = { sceneId: string; lineIndex: number; speaker: string; text: string; file: string };
type VoiceStory = { scenes: { id: string; media?: { video?: string | null }; lines?: { speaker: string; text: string; audio?: string }[] }[] };

export function attachMummysPartyVoices<T extends VoiceStory>(story: T, lines: VoiceLine[] = manifest.lines): T {
  const scenes = new Map(story.scenes.map((scene) => [scene.id, scene]));
  for (const entry of lines) {
    const scene = scenes.get(entry.sceneId);
    if (scene?.media?.video) continue;
    const line = scene?.lines?.[entry.lineIndex];
    if (line?.speaker === entry.speaker && line.text === entry.text && !line.audio) {
      line.audio = `assets/audio/en/${entry.file}`;
    }
  }
  return story;
}
