import { z } from 'zod';

const TextAsset = z.union([z.string(), z.null()]);

export const CharacterYamlSchema = z.object({
  id: z.string(), name: z.string(), image: TextAsset, audio: TextAsset, metadata: z.unknown(),
  voice: z.object({ pitch: z.number(), rate: z.number() }).optional(), colour: z.string().optional(),
}).passthrough();

const BranchYamlSchema = z.object({
  id: z.union([z.string(), z.null()]).optional(), object_id: z.union([z.string(), z.null()]).optional(),
  choice: z.string(), next_scene: TextAsset,
}).passthrough();

export const SceneYamlSchema = z.object({
  id: z.string(), title: z.string(), type: z.enum(['narrative', 'choice', 'roll', 'special']),
  active_character: z.union([z.string(), z.null()]), description: z.string(), next_scene: TextAsset,
  difficulty: z.unknown(),
  media: z.object({ image: TextAsset, audio: TextAsset, video: TextAsset, stage3d: z.unknown().optional(), model3d: z.unknown().optional() }).passthrough(),
  branches: z.array(BranchYamlSchema), metadata: z.unknown(),
  lines: z.array(z.object({ speaker: z.string(), text: z.string(), audio: TextAsset.optional() })).optional(),
  task: z.object({ text: z.string(), audio: TextAsset.optional() }).optional(),
  cast: z.array(z.object({ character_id: z.string(), slot: z.enum(['left', 'center', 'right']), pose: z.string().nullable().optional(), reactions: z.array(z.enum(['jump', 'startle', 'wave'])).optional() })).max(3).optional(),
  overlays: z.array(z.object({ id: z.string(), text: z.string(), x: z.number().min(0).max(1), y: z.number().min(0).max(1), align: z.enum(['start', 'center', 'end']).optional(), style: z.enum(['caption', 'callout', 'label']).optional(), max_width: z.number().min(0).max(1).optional() })).optional(),
  objects: z.array(z.object({ id: z.string(), label: z.string().optional(), geometry: z.object({ bounds: z.array(z.number()).optional() }).passthrough().optional(), reveal: z.object({ text: z.string(), image: TextAsset.optional() }).optional() }).passthrough()).optional(),
  practice: z.object({ answer: z.object({ branch: z.string().optional(), object: z.string().optional(), order: z.array(z.string()).optional(), parts: z.array(z.string()).optional() }).passthrough(), hint: z.object({ text: z.string(), audio: TextAsset.optional() }).optional(), on_wrong: z.array(z.object({ text: z.string(), audio: TextAsset.optional() })).optional(), reveal_after: z.number().int().min(1).optional() }).passthrough().optional(),
  interaction: z.record(z.string(), z.unknown()).optional(),
  research: z.object({ step: z.enum(['where', 'find', 'verify', 'use']), source: z.object({ kind: z.enum(['character', 'picture', 'clip', 'chart', 'page']), label: z.string() }).optional() }).optional(),
  exit_allowed: z.boolean().optional(), host_slot: TextAsset.optional(), auto_advance: z.boolean().optional(),
}).passthrough();

const LessonYamlSchema = z.object({
  id: z.string(), title: z.string(),
  pieces: z.array(z.object({ id: z.string(), title: z.string(), scenes: z.array(z.string()).optional(), versions: z.array(z.object({ id: z.string(), scenes: z.array(z.string()), method: z.string().optional() })).optional() }).passthrough()),
  checks: z.array(z.object({ id: z.string(), title: z.string().optional(), questions: z.array(z.object({ id: z.string(), scene: z.string(), answer: z.record(z.string(), z.unknown()), research: z.array(z.string()).optional() })) })).optional(),
  result: z.object({ scene: z.string(), key: z.object({ label: z.string(), image: TextAsset.optional() }).optional() }).optional(),
}).passthrough();

const DemoYamlSchema = z.object({ profiles: z.array(z.object({
  id: z.string(), display_name: z.string(), strengths: z.array(z.string()).optional(),
  versions: z.record(z.string(), z.string()).optional(), order: z.enum(['fixed', 'child_chooses']).optional(),
  rationale: z.record(z.string(), z.string()).optional(),
}).passthrough()) }).passthrough();

export const StoryYamlSchema = z.object({
  schema_version: z.string().optional(), version: z.string().optional(),
  title: z.string(), description: z.string(), image: z.string(), tags: z.array(z.string()),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']), session_length: z.enum(['Short', 'Medium', 'Long', 'Very Long']),
  age_group: z.enum(['1-2', '3-5', '6-9', '10-12', '13-18', '19+']), minimum_age: z.number().int(),
  core_axes: z.unknown(), archetypes: z.array(z.string()), characters: z.array(CharacterYamlSchema),
  scenes: z.array(SceneYamlSchema), lesson: LessonYamlSchema.optional(), demo: DemoYamlSchema.optional(),
}).passthrough();

export type StoryYaml = z.infer<typeof StoryYamlSchema>;
export type SceneYaml = z.infer<typeof SceneYamlSchema>;
