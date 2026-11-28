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

  it('maps keyed practice outcomes to local IDs and rejects unknown or misclassified IDs', () => {
    const choice = story.scenes.find((scene) => scene.id === 'who_said_it')!;
    const withOutcomes = { ...choice, practice: { ...choice.practice!, outcomes: {
      friend: { on_wrong: { text: 'Kai heard a video.' } },
      video: { on_correct: { image: { src: '/truth.webp', alt: 'Kai points at the video' }, line: { text: 'A video made the claim.' } } },
    } } };
    const compiled = compileScene(withOutcomes, story, ['choices']);
    expect(compiled.interaction).toMatchObject({ type: 'choices', local: { correctId: 'video', outcomes: {
      friend: { onWrong: { text: 'Kai heard a video.' } },
      video: { onCorrect: { image: { imageUrl: '/truth.webp', alt: 'Kai points at the video' }, line: { text: 'A video made the claim.' } } },
    } } });
    expect(JSON.stringify(compiled)).not.toContain('"answer"');
    expect(() => compileScene({ ...withOutcomes, practice: { ...withOutcomes.practice, outcomes: { unknown: { on_wrong: { text: 'No.' } } } } }, story, ['choices'])).toThrow(/not a selectable answer/);
    expect(() => compileScene({ ...withOutcomes, practice: { ...withOutcomes.practice, outcomes: { friend: { on_correct: { line: { text: 'Wrong.' } } } } } }, story, ['choices'])).toThrow(/invalid choice/);
    const hotspot = story.scenes.find((scene) => scene.id === 'how_know_find')!;
    expect(() => compileScene({ ...hotspot, practice: { ...hotspot.practice!, outcomes: { crow: { on_correct: { line: { text: 'Crow.' } } } } } }, story, ['hotspots'])).toThrow(/invalid choice/);
  });

  it('preserves Engine-supplied sequence order and transforms practice answer without raw fields', () => {
    const scene = story.scenes.find((candidate) => candidate.id === 'how_know_teach')!;
    expect(() => compileScene(scene, story, ['choices', 'hotspots'])).toThrow(/Unsupported interaction: sequence/);
    const node = compileScene(scene, story, ['sequence'], 'demo_daan', ['ear', 'eye', 'book']);
    expect(node.interaction).toMatchObject({ type: 'sequence', items: [{ id: 'ear' }, { id: 'eye' }, { id: 'book' }], local: { order: ['eye', 'book', 'ear'] } });
    expect(JSON.stringify(node)).not.toContain('"answer"');
    expect(() => compileScene(scene, story, ['sequence'], 'demo_daan', ['ear', 'eye', 'eye'])).toThrow(/invalid Engine-supplied sequence order/);
  });

  it('compiles inspect parts and transformed practice flags only when enabled', () => {
    const scene = story.scenes.find((candidate) => candidate.id === 'what_do_they_want')!;
    expect(() => compileScene(scene, story, [])).toThrow(/Unsupported interaction: inspect/);
    const node = compileScene(scene, story, ['inspect']);
    expect(node.interaction).toMatchObject({ type: 'inspect', minMarks: 1, document: { kind: 'message', title: 'FREE COINS!!!', parts: [{ id: 'sender' }, { id: 'body' }, { id: 'link' }, { id: 'price' }] }, local: { flagged: ['link', 'price'] } });
    expect(JSON.stringify(node)).not.toContain('"answer"');
    expect(NodeSchema.parse(JSON.parse(JSON.stringify(node)))).toEqual(node);
  });
});
