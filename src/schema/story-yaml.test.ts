import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import corePreview from '../../content/manor/core-preview.story.yaml?raw';
import pumpkinGate from '../../content/manor/pumpkin-gate.story.yaml?raw';
import { StoryYamlSchema } from './story-yaml';

describe('Story YAML foundation schema', () => {
  it.each([
    ['core preview', corePreview],
    ['Pumpkin Gate', pumpkinGate],
  ])('parses the %s content without dropping legacy fields', (_name, source) => {
    const authored = parse(source);
    const story = StoryYamlSchema.parse(authored);
    expect(story.scenes.map((scene) => scene.id)).toEqual(authored.scenes.map((scene: { id: string }) => scene.id));
    expect(story.scenes[0]?.metadata).toEqual(authored.scenes[0].metadata);
    expect(story.scenes[0]?.media).toEqual(authored.scenes[0].media);
  });

  it('rejects a scene missing required legacy media fields', () => {
    const story = parse(corePreview);
    delete story.scenes[0].media.audio;
    expect(StoryYamlSchema.safeParse(story).success).toBe(false);
  });
});
