import { describe, expect, it } from 'vitest';
import { attachMummysPartyVoices } from './mummysPartyVoices';

describe('Mummy’s Party voice manifest', () => {
  it('attaches only audio that matches the scene, speaker and current text', () => {
    const story = { scenes: [{ id: 'first', lines: [
      { speaker: 'ghost', text: 'Stay outside.' },
      { speaker: 'mummy', text: 'What now?', audio: 'authored.mp3' },
    ] }] };
    attachMummysPartyVoices(story, [
      { sceneId: 'first', lineIndex: 0, speaker: 'ghost', text: 'Stay outside.', file: 'ghost-good.mp3' },
      { sceneId: 'first', lineIndex: 0, speaker: 'ghost', text: 'Old wording.', file: 'ghost-stale.mp3' },
      { sceneId: 'first', lineIndex: 1, speaker: 'mummy', text: 'What now?', file: 'mummy.mp3' },
    ]);
    expect(story.scenes[0]?.lines[0]?.audio).toBe('assets/audio/en/ghost-good.mp3');
    expect(story.scenes[0]?.lines[1]?.audio).toBe('authored.mp3');
  });
  it('keeps video dialogue as captions and leaves its audio to the video', () => {
    const story = { scenes: [{ id: 'opening_video', media: { video: 'assets/opening_video.mp4' }, lines: [{ speaker: 'ghost', text: 'Can you make it safe?' }] }] };
    attachMummysPartyVoices(story, [{ sceneId: 'opening_video', lineIndex: 0, speaker: 'ghost', text: 'Can you make it safe?', file: 'unused.mp3' }]);
    expect(story.scenes[0]?.lines[0]).toEqual({ speaker: 'ghost', text: 'Can you make it safe?' });
  });
});
