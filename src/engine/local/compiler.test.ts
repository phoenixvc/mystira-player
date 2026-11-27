import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import pumpkinGate from '../../../content/manor/pumpkin-gate.story.yaml?raw';
import { StoryYamlSchema } from '../../schema/story-yaml';
import { compileScene } from './compiler';

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
});
