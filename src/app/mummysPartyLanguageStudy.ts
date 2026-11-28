import english from './mummysPartyVoiceManifest.json';
import afrikaans from './mummysPartyVoiceManifest.af.json';
import timing from './mummysPartyTiming.json';
import translations from '../../content/manor/fire-door.af.preview.json';
import type { LanguagePair } from '../player/LanguageExplorer';

type AuthoredScene = { id: string; description: string; active_character: string | null; lines?: { speaker: string; text: string }[] };
export type LanguagePairLookup = (sceneId: string, lineIndex: number, currentText: string) => LanguagePair | undefined;

// Curated concept links for the demo. Translation is often many-to-one, so these
// are phrases, not automatically aligned individual words.
const links: Record<string, LanguagePair['links']> = {
  'spot_table:0': [
    { en: 'fire hazard', af: 'Brandgevaar' },
    { en: 'trap us inside', af: 'ons binne vaskeer' },
  ],
  'spot_table_after:0': [
    { en: 'Battery candles', af: 'Batterykerse' },
    { en: 'no flame', af: 'geen vlam nie' },
  ],
  'max_s1_01:0': [
    { en: 'fire hazards', af: 'brandgevare' },
    { en: 'Tell him', af: 'Sê vir hom' },
  ],
  'max_s1_01:1': [
    { en: 'real candle', af: 'Regte kers' },
  ],
};

export function createMummysPartyLanguagePair(story: { scenes: AuthoredScene[] }): LanguagePairLookup {
  // Capture the English copy before the local Afrikaans overlay mutates the story.
  const authoredScenes = new Map(story.scenes.map((scene) => [scene.id, {
    description: scene.description,
    active_character: scene.active_character,
    lines: scene.lines?.map((line) => ({ speaker: line.speaker, text: line.text })),
  }]));
  return (sceneId, lineIndex, currentText) => {
    const find = (lines: typeof english.lines | typeof afrikaans.lines) =>
      lines.find((entry) => entry.sceneId === sceneId && (entry.lineIndex === lineIndex || (lineIndex === 0 && entry.lineIndex === -1)));
    const en = find(english.lines);
    const af = find(afrikaans.lines);
    if (!en || !af || (currentText !== en.text && currentText !== af.text)) return undefined;
    const authored = authoredScenes.get(sceneId);
    const translated = translations.scenes[sceneId as keyof typeof translations.scenes];
    const expected = (scene: { description: string; lines?: ({ text: string } | string)[] } | undefined) => {
      const line = scene?.lines?.[lineIndex];
      return typeof line === 'string' ? line : line?.text ?? (!scene?.lines?.length && lineIndex === 0 ? scene?.description : undefined);
    };
    const speaker = authored?.lines?.[lineIndex]?.speaker ?? (!authored?.lines?.length ? authored?.active_character : undefined);
    if (expected(authored) !== en.text || expected(translated) !== af.text || speaker !== en.speaker || speaker !== af.speaker) return undefined;
    const key = `${sceneId}:${lineIndex}`;
    const phrases = links[key] ?? [];
    if (phrases.some((link) => !en.text.toLowerCase().includes(link.en.toLowerCase()) || !af.text.toLowerCase().includes(link.af.toLowerCase()))) {
      throw new Error(`Invalid language study link for ${key}.`);
    }
    const asset = (locale: 'en' | 'af', file: string) => `${import.meta.env.BASE_URL}mummys-party/audio/${locale}/${file}`;
    const words = (locale: 'en' | 'af', entry: typeof en) => timing.clips.find((clip) => clip.sceneId === sceneId && clip.lineIndex === entry.lineIndex && clip.locale === locale && clip.text === entry.text && clip.file === entry.file)?.words;
    return { sceneId, lineIndex, en: { text: en.text, audioUrl: asset('en', en.file), words: words('en', en) }, af: { text: af.text, audioUrl: asset('af', af.file), words: words('af', af) }, links: phrases };
  };
}
