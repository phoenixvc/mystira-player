import english from './mummysPartyVoiceManifest.json';
import afrikaans from './mummysPartyVoiceManifest.af.json';

type VoiceLine = { sceneId: string; lineIndex: number; speaker: string; text: string; file: string };
type VoiceStory = { scenes: { id: string; description?: string; active_character?: string | null; media?: { video?: string | null; audio?: string | null }; task?: { text: string; audio?: string | null }; lines?: { speaker: string; text: string; audio?: string | null }[] }[] };

export function attachMummysPartyVoices<T extends VoiceStory>(story: T, locale: 'en' | 'af' = 'en', lines: VoiceLine[] = locale === 'af' ? afrikaans.lines : english.lines): T {
  const scenes = new Map(story.scenes.map((scene) => [scene.id, scene]));
  for (const entry of lines) {
    const scene = scenes.get(entry.sceneId);
    if (scene?.media?.video) continue;
    if (entry.lineIndex === -2) {
      if (scene?.task?.text === entry.text && entry.speaker === 'guide' && !scene.task.audio) scene.task.audio = `assets/audio/${locale}/${entry.file}`;
      continue;
    }
    if (entry.lineIndex === -1) {
      if (scene?.media && !scene.lines?.length && scene.active_character === entry.speaker && scene.description === entry.text && !scene.media.audio) scene.media.audio = `assets/audio/${locale}/${entry.file}`;
      continue;
    }
    const line = scene?.lines?.[entry.lineIndex];
    if (line?.speaker === entry.speaker && line.text === entry.text && !line.audio) {
      line.audio = `assets/audio/${locale}/${entry.file}`;
    }
  }
  return story;
}
