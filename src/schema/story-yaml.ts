import { z } from 'zod';

const TextAsset = z.union([z.string(), z.null()]);
const RequiredOpaque = z.unknown().refine((value) => value !== undefined, 'Required legacy field is missing');
const TimestampYamlSchema = z.object({
  word: z.string(), startMs: z.number().min(0), endMs: z.number().min(0),
  charStart: z.number().int().min(0).nullable().optional(), charEnd: z.number().int().min(0).nullable().optional(),
}).strict();
const MusicProfiles = ['none', 'neutral', 'cozy', 'playful', 'wonder', 'mystery', 'tense', 'action', 'sad', 'victory'] as const;
const MusicPaletteYamlSchema = z.object({
  tracks_by_profile: z.record(z.enum(MusicProfiles), z.array(z.string())),
}).strict();
const InteractionYamlSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('sequence'),
    items: z.array(z.object({ id: z.string(), label: z.string(), image: TextAsset.optional() }).strict()).min(3).max(5),
  }).strict(),
  z.object({
    kind: z.literal('inspect'), min_marks: z.number().int().min(0).optional(),
    document: z.object({
      kind: z.enum(['message', 'page', 'sign']), title: z.string(),
      parts: z.array(z.object({ id: z.string(), role: z.enum(['sender', 'heading', 'text', 'link', 'button', 'image', 'price', 'footer']), text: z.string(), image: TextAsset.optional() }).strict()).min(3).max(8),
    }).strict(),
  }).strict(),
]);

export const CharacterYamlSchema = z.object({
  id: z.string(), name: z.string(), image: TextAsset, audio: TextAsset, metadata: RequiredOpaque,
  voice: z.object({ pitch: z.number().min(0.1).max(2), rate: z.number().min(0.1).max(2) }).strict().optional(), colour: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
}).strict();

const BranchYamlSchema = z.object({
  id: z.union([z.string(), z.null()]).optional(), object_id: z.union([z.string(), z.null()]).optional(),
  choice: z.string(), next_scene: TextAsset,
  action_id: z.unknown().optional(), target_object_id: z.unknown().optional(), verb: TextAsset.optional(), skill_tag: z.unknown().optional(),
  difficulty: z.unknown().optional(), risk: z.unknown().optional(), requirements: z.unknown().optional(),
  modifier_sources: z.unknown().optional(), modifier_preview: z.unknown().optional(), effects: z.unknown().optional(),
  success_next_scene: z.unknown().optional(), success_rewind_policy: z.unknown().optional(), success_effects: z.unknown().optional(),
  failure_next_scene: z.unknown().optional(), failure_rewind_policy: z.unknown().optional(), failure_effects: z.unknown().optional(),
  rewind_policy: z.unknown().optional(), echo_log: z.unknown().optional(), compass_change: z.unknown().optional(), image: TextAsset.optional(),
}).strict();

export const SceneYamlSchema = z.object({
  id: z.string(), title: z.string(), type: z.enum(['narrative', 'choice', 'roll', 'special']),
  act_id: z.unknown().optional(), scene_objects: z.unknown().optional(), choice_structure: z.unknown().optional(), scored_axes: z.unknown().optional(), path_type: z.unknown().optional(),
  active_character: z.union([z.string(), z.null()]), description: z.string(), next_scene: TextAsset,
  difficulty: RequiredOpaque, roll_routes: z.unknown().optional(), next_scene_rewind_policy: z.unknown().optional(), rewind_policy: z.unknown().optional(),
  media: z.object({ image: TextAsset, audio: TextAsset, video: TextAsset, stage3d: z.unknown().optional(), model3d: z.unknown().optional(),
    timestamps: z.array(TimestampYamlSchema).nullable().optional(),
    alignment: z.object({ characters: z.array(z.string()), character_start_times_seconds: z.array(z.number().min(0)), character_end_times_seconds: z.array(z.number().min(0)) }).strict().optional(),
  }).strict(),
  sound_effects: z.unknown().optional(), echo_reveals: z.unknown().optional(),
  branches: z.array(BranchYamlSchema), metadata: RequiredOpaque,
  lines: z.array(z.object({ speaker: z.string(), text: z.string(), audio: TextAsset.optional() }).strict()).optional(),
  task: z.object({ text: z.string(), audio: TextAsset.optional() }).strict().optional(),
  cast: z.array(z.object({ character_id: z.string(), slot: z.enum(['left', 'center', 'right']), pose: z.string().nullable().optional(), reactions: z.array(z.enum(['jump', 'startle', 'wave'])).optional() }).strict()).max(3).optional(),
  overlays: z.array(z.object({ id: z.string(), text: z.string(), x: z.number().min(0).max(1), y: z.number().min(0).max(1), align: z.enum(['start', 'center', 'end']).optional(), style: z.enum(['caption', 'callout', 'label']).optional(), max_width: z.number().min(0).max(1).optional() }).strict()).optional(),
  objects: z.array(z.object({ id: z.string(), name: z.string().optional(), label: z.string().optional(), description: TextAsset.optional(), type: z.string().optional(),
    state: z.unknown().optional(), action_ids: z.unknown().optional(), position: z.unknown().optional(), interactions: z.unknown().optional(), geometry: z.object({
    anchor: TextAsset.optional(), position_offset: z.array(z.number()).length(3).nullable().optional(),
    scale: z.number().min(0.01).max(100).nullable().optional(), facing: TextAsset.optional(), rotation_y_deg: z.number().nullable().optional(),
    bounds: z.array(z.number()).nullable().optional(),
  }).strict().nullable().optional(), reveal: z.object({ text: z.string(), image: TextAsset.optional() }).strict().optional() }).strict()).optional(),
  practice: z.object({ answer: z.object({ branch: z.string().optional(), object: z.string().optional(), order: z.array(z.string()).min(3).max(5).optional(), parts: z.array(z.string()).optional() }).strict(), hint: z.object({ text: z.string(), audio: TextAsset.optional() }).strict().optional(), on_wrong: z.array(z.object({ text: z.string(), audio: TextAsset.optional() }).strict()).optional(), reveal_after: z.number().int().min(1).max(5).optional() }).strict().optional(),
  interaction: InteractionYamlSchema.optional(),
  research: z.object({ step: z.enum(['where', 'find', 'verify', 'use']), source: z.object({ kind: z.enum(['character', 'picture', 'clip', 'chart', 'page']), label: z.string() }).strict().optional() }).strict().optional(),
  exit_allowed: z.boolean().optional(), host_slot: TextAsset.optional(), auto_advance: z.boolean().optional(),
  narration_timestamps: z.array(TimestampYamlSchema).nullable().optional(),
  music: z.object({
    profile: z.enum(['none', 'neutral', 'cozy', 'playful', 'wonder', 'mystery', 'tense', 'action', 'sad', 'victory']),
    continuity: z.enum(['none', 'prefer_continue', 'allow_change', 'force_change', 'force_silence']),
    priority: z.enum(['none', 'background', 'important']).optional(),
    transition_hint: z.enum(['none', 'auto', 'keep', 'crossfade_short', 'crossfade_normal', 'crossfade_long', 'hard_cut']).optional(),
    energy: z.number().min(0).max(1).optional(),
    ducking: z.enum(['none', 'narration', 'dialogue']).optional(),
  }).strict().optional(),
}).strict();

const LessonYamlSchema = z.object({
  id: z.string(), title: z.string(),
  pieces: z.array(z.object({ id: z.string(), title: z.string(), scenes: z.array(z.string()).min(1).optional(), versions: z.array(z.object({ id: z.string(), scenes: z.array(z.string()).min(1), method: z.string().optional() }).strict()).min(2).optional() }).strict()).min(1),
  checks: z.array(z.object({ id: z.string(), title: z.string().optional(), questions: z.array(z.object({ id: z.string(), scene: z.string(), answer: z.object({ branch: z.string().optional(), object: z.string().optional(), order: z.array(z.string()).min(3).max(5).optional(), parts: z.array(z.string()).optional() }).strict(), research: z.array(z.string()).optional() }).strict()).min(1) }).strict()).optional(),
  result: z.object({ scene: z.string(), key: z.object({ label: z.string(), image: TextAsset.optional() }).strict().optional() }).strict().optional(),
}).strict();

const DemoYamlSchema = z.object({ profiles: z.array(z.object({
  id: z.string(), display_name: z.string(), strengths: z.array(z.string()).optional(),
  versions: z.record(z.string(), z.string()).optional(), order: z.enum(['fixed', 'child_chooses']).optional(),
  rationale: z.record(z.string(), z.string()).optional(),
}).strict()).min(1) }).strict();

export const StoryYamlSchema = z.object({
  schema_version: z.string().optional(), version: z.string().optional(),
  requirement_catalogs: z.unknown().optional(), skill_catalog: z.unknown().optional(), character_skill_values: z.unknown().optional(), initial_progress: z.unknown().optional(), acts: z.unknown().optional(),
  title: z.string(), description: z.string(), image: z.string(), tags: z.array(z.string()),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']), session_length: z.enum(['Short', 'Medium', 'Long', 'Very Long']),
  age_group: z.enum(['1-2', '3-5', '6-9', '10-12', '13-18', '19+']), minimum_age: z.number().int(),
  core_axes: RequiredOpaque, archetypes: z.array(z.string()), characters: z.array(CharacterYamlSchema),
  music_palette: MusicPaletteYamlSchema.optional(),
  scenes: z.array(SceneYamlSchema), lesson: LessonYamlSchema.optional(), demo: DemoYamlSchema.optional(),
}).strict();

export type StoryYaml = z.infer<typeof StoryYamlSchema>;
export type SceneYaml = z.infer<typeof SceneYamlSchema>;
