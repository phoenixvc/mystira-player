import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import pumpkinGate from '../../../content/manor/pumpkin-gate.story.yaml?raw';
import { StoryYamlSchema } from '../../schema/story-yaml';
import { compileScene } from './compiler';
import { NodeSchema } from '../../schema/node';

const story = StoryYamlSchema.parse(parse(pumpkinGate));

describe('local scene compilation', () => {
  it('keeps authored assessment answers out of player nodes', () => {
    const scene = story.scenes.find((candidate) => candidate.id === 'q1_free_coins');
    expect(scene).toBeDefined();
    const node = compileScene(scene!, story, ['choices']);
    expect(node.type).toBe('scene');
    expect(node.interaction.type).toBe('choices');
    expect(JSON.stringify(node)).not.toContain('"answer"');
    expect(JSON.stringify(node)).not.toContain('"correctId"');
  });

  it('rejects interactions disabled by configuration', () => {
    const scene = story.scenes.find((candidate) => candidate.id === 'who_said_it');
    expect(scene).toBeDefined();
    expect(() => compileScene(scene!, story, [])).toThrow(/Unsupported interaction: choices/);
  });

  it('maps core media, narration and music without exposing authored answer fields', () => {
    const source = story.scenes.find((candidate) => candidate.type === 'narrative' && candidate.branches.length === 0)!;
    const scene = { ...source, interaction: undefined, branches: [], lines: undefined, media: { ...source.media, image: '/scene.webp', audio: '/line.mp3', video: '/clip.mp4' }, music: { profile: 'cozy' as const, continuity: 'allow_change' as const } };
    const node = compileScene(scene, story);
    expect(node.media).toMatchObject({ imageUrl: '/scene.webp', video: { url: '/clip.mp4' } });
    expect(node.lines[0]).toMatchObject({ speakerId: 'narrator', text: source.description, audioUrl: '/line.mp3' });
    expect(node.music).toEqual({ profile: 'cozy' });
  });

  it('compiles generated supported scene variants into round-trippable nodes', () => {
    const source = story.scenes.find((candidate) => candidate.type === 'narrative' && candidate.branches.length === 0)!;
    for (let seed = 0; seed < 16; seed += 1) {
      const scene = {
        ...source, id: `generated-${seed}`, branches: [], interaction: undefined,
        lines: seed % 2 === 0 ? undefined : [{ speaker: story.characters[0]!.id, text: `Line ${seed}` }],
        media: { ...source.media, image: seed % 2 === 0 ? '/scene.webp' : null, audio: seed % 3 === 0 ? '/line.mp3' : null, video: null },
        auto_advance: seed % 4 === 0,
      };
      const node = compileScene(scene, story);
      expect(node.id).toBe(scene.id);
      expect(NodeSchema.parse(JSON.parse(JSON.stringify(node)))).toEqual(node);
    }
  });
});
