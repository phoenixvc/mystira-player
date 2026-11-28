import { describe, expect, it } from 'vitest';
import { parse, stringify } from 'yaml';
import corePreview from '../../content/manor/core-preview.story.yaml?raw';
import pumpkinGate from '../../content/manor/pumpkin-gate.story.yaml?raw';
import schemaText from '../../schema/story-schema-2.1.json?raw';
import { CharacterYamlSchema, SceneYamlSchema, StoryYamlSchema } from './story-yaml';

describe('Story YAML foundation schema', () => {
  it('declares every top-level, scene and character field in the JSON schema', () => {
    const json = JSON.parse(schemaText);
    const keys = (value: Record<string, unknown>) => Object.keys(value).sort();
    expect(keys(StoryYamlSchema.shape)).toEqual(keys(json.properties));
    expect(keys(SceneYamlSchema.shape)).toEqual(keys(json.properties.scenes.items.properties));
    expect(keys(CharacterYamlSchema.shape)).toEqual(keys(json.properties.characters.items.properties));
    expect(keys(SceneYamlSchema.shape.media.shape)).toEqual(keys(json.properties.scenes.items.properties.media.properties));
    expect(keys(SceneYamlSchema.shape.branches.element.shape)).toEqual(keys(json.properties.scenes.items.properties.branches.items.properties));
    expect(keys(SceneYamlSchema.shape.objects.unwrap().element.shape)).toEqual(keys(json.properties.scenes.items.properties.objects.items.properties));
    expect(keys(SceneYamlSchema.shape.practice.unwrap().shape)).toEqual(keys(json.properties.scenes.items.properties.practice.properties));
    expect(keys(SceneYamlSchema.shape.music.unwrap().shape)).toEqual(keys(json.properties.scenes.items.properties.music.properties));
    expect(keys(StoryYamlSchema.shape.lesson.unwrap().shape)).toEqual(keys(json.properties.lesson.properties));
    expect(keys(StoryYamlSchema.shape.lesson.unwrap().shape.pieces.element.shape)).toEqual(keys(json.properties.lesson.properties.pieces.items.properties));
    expect(keys(StoryYamlSchema.shape.demo.unwrap().shape.profiles.element.shape)).toEqual(keys(json.properties.demo.properties.profiles.items.properties));
  });
  it.each([
    ['core preview', corePreview],
    ['Pumpkin Gate', pumpkinGate],
  ])('parses the %s content without dropping legacy fields', (_name, source) => {
    const authored = parse(source);
    const story = StoryYamlSchema.parse(authored);
    expect(story).toEqual(authored);
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

  it('rejects malformed interactions and round trips the declared variants', () => {
    const authored = parse(corePreview);
    for (const interaction of ['sequence', null, [], { kind: 'sequence' }, { kind: 'inspect', document: {} }]) {
      authored.scenes[0].interaction = interaction;
      expect(StoryYamlSchema.safeParse(authored).success).toBe(false);
    }
    authored.scenes[0].interaction = { kind: 'sequence', items: ['a', 'b', 'c'].map((id) => ({ id, label: id })) };
    const sequence = StoryYamlSchema.parse(authored);
    expect(StoryYamlSchema.parse(parse(stringify(sequence)))).toEqual(sequence);
    authored.scenes[0].interaction = { kind: 'inspect', min_marks: 0, document: { kind: 'page', title: 'Look closer', parts: ['a', 'b', 'c'].map((id) => ({ id, role: 'text', text: id })) } };
    const inspect = StoryYamlSchema.parse(authored);
    expect(StoryYamlSchema.parse(parse(stringify(inspect)))).toEqual(inspect);
  });

  it('preserves opaque engine fields through YAML round trips across generated values', () => {
    for (let seed = 0; seed < 24; seed += 1) {
      const authored = parse(corePreview);
      authored.core_axes = { seed, values: [seed, seed + 1] };
      authored.requirement_catalogs = { generated: { threshold: seed / 24 } };
      authored.scenes[0].difficulty = { generated: seed };
      authored.scenes[0].metadata = { generated: [seed, null, `value-${seed}`] };
      authored.scenes[0].media.timestamps = [{ word: 'gate', startMs: seed, endMs: seed + 1 }];
      authored.scenes[0].auto_advance = seed % 2 === 0;
      const parsed = StoryYamlSchema.parse(authored);
      expect(parsed).toEqual(authored);
      expect(StoryYamlSchema.parse(parse(stringify(parsed)))).toEqual(parsed);
    }
  });

  it('accepts JSON-schema-valid optional music, timestamps, null geometry and empty legacy arrays', () => {
    const authored = parse(corePreview);
    authored.tags = [];
    authored.archetypes = [];
    authored.characters = [];
    authored.music_palette = { tracks_by_profile: { cozy: ['track-a'] } };
    authored.scenes[0].narration_timestamps = [{ word: 'gate', startMs: 0, endMs: 100, charStart: null }];
    authored.scenes[0].media.alignment = { characters: [], character_start_times_seconds: [], character_end_times_seconds: [] };
    authored.scenes[0].objects = [{ id: 'gate', geometry: null }];
    expect(StoryYamlSchema.parse(authored)).toEqual(authored);
    authored.scenes[0].narration_timestamps[0].startMs = -1;
    expect(StoryYamlSchema.safeParse(authored).success).toBe(false);
  });
});
