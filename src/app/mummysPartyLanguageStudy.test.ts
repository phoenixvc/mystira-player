import { describe, expect, it } from 'vitest';
import english from './mummysPartyVoiceManifest.json';
import afrikaans from './mummysPartyVoiceManifest.af.json';
import storyRaw from '../../content/manor/fire-door.story.yaml?raw';
import { parse } from 'yaml';
import { createMummysPartyLanguagePair } from './mummysPartyLanguageStudy';

const mummysPartyLanguagePair = createMummysPartyLanguagePair(parse(storyRaw));

describe('Mummy’s Party language study', () => {
  it('pairs every recorded first-lesson line in both languages without using a stale text match', () => {
    expect(english.lines).toHaveLength(20);
    expect(afrikaans.lines).toHaveLength(20);
    for (const line of english.lines) {
      const displayedIndex = line.lineIndex === -1 ? 0 : line.lineIndex;
      const pair = mummysPartyLanguagePair(line.sceneId, displayedIndex, line.text);
      expect(pair?.en.text).toBe(line.text);
      expect(pair?.en.audioUrl).toContain(`/audio/en/${line.file}`);
      expect(pair?.af.audioUrl).toMatch(/\/audio\/af\/(ghost|mummy)-[a-f0-9]+\.mp3$/);
      expect(mummysPartyLanguagePair(line.sceneId, displayedIndex, pair!.af.text)?.en.text).toBe(line.text);
      expect(mummysPartyLanguagePair(line.sceneId, displayedIndex, `${line.text} changed`)).toBeUndefined();
    }
    expect(mummysPartyLanguagePair('opening_video', 0, 'caption')).toBeUndefined();
  });

  it('offers curated meaning links in both child paths', () => {
    expect(mummysPartyLanguagePair('spot_table_after', 0, english.lines[1]!.text)?.links.map((link) => link.af)).toContain('geen vlam nie');
    const max = english.lines.find((line) => line.sceneId === 'max_s1_01' && line.lineIndex === 0)!;
    expect(mummysPartyLanguagePair(max.sceneId, 0, max.text)?.links.some((link) => link.en === 'fire hazards')).toBe(true);
    expect(mummysPartyLanguagePair(max.sceneId, 0, max.text)?.af.words?.length).toBeGreaterThan(0);
    expect(mummysPartyLanguagePair('spot_table', 0, english.lines[0]!.text)?.en.words?.length).toBeGreaterThan(0);
  });
});
