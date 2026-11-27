import { describe, expect, it } from 'vitest';
import { parse, stringify } from 'yaml';
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

  it.each(['title', 'description', 'image', 'tags', 'difficulty', 'session_length', 'age_group', 'minimum_age', 'core_axes', 'archetypes', 'characters', 'scenes'])('rejects a missing top-level %s field', (field) => {
    const story = parse(corePreview);
    delete story[field];
    const result = StoryYamlSchema.safeParse(story);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((issue) => issue.path[0] === field)).toBe(true);
  });

  it.each(['id', 'title', 'type', 'active_character', 'description', 'next_scene', 'difficulty', 'media', 'branches', 'metadata'])('rejects a missing scene %s field', (field) => {
    const story = parse(corePreview);
    delete story.scenes[0][field];
    const result = StoryYamlSchema.safeParse(story);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((issue) => issue.path.join('.') === `scenes.0.${field}`)).toBe(true);
  });

  it('round trips authored content and the per-scene auto-advance field', () => {
    const story = parse(corePreview);
    story.scenes[0].auto_advance = true;
    const first = StoryYamlSchema.parse(story);
    expect(StoryYamlSchema.parse(parse(stringify(first)))).toEqual(first);
    story.scenes[0].auto_advance = 'yes';
    expect(StoryYamlSchema.safeParse(story).success).toBe(false);
  });
});
