import { z } from 'zod';
export const RegionSchema = z.union([
  z.object({ shape: z.literal('rect'), x: z.number().min(0).max(1), y: z.number().min(0).max(1), w: z.number().min(0).max(1), h: z.number().min(0).max(1) }),
  z.object({ shape: z.literal('circle'), x: z.number().min(0).max(1), y: z.number().min(0).max(1), r: z.number().min(0).max(1) }),
]);
export type Region = z.infer<typeof RegionSchema>;
export const NarrationSchema = z.object({ text: z.string(), audioUrl: z.string().optional(), wordTimings: z.array(z.object({ word: z.string(), startMs: z.number(), endMs: z.number() })).optional() });
export const SceneBaseSchema = z.object({
  id: z.string(), title: z.string().optional(),
  media: z.object({ imageUrl: z.string().optional(), alt: z.string().optional(), video: z.object({ url: z.string(), posterUrl: z.string().optional(), onEnd: z.enum(['advance', 'stop']), skippable: z.boolean() }).optional() }),
  characters: z.array(z.object({ id: z.string(), imageUrl: z.string(), alt: z.string(), position: z.enum(['left', 'center', 'right']), pose: z.string().optional(), reactions: z.array(z.enum(['jump', 'startle', 'wave'])).optional() })),
  speakers: z.array(z.object({ id: z.string(), name: z.string(), avatarUrl: z.string().optional(), colour: z.string().regex(/^#[0-9A-Fa-f]{6}$/), voice: z.object({ pitch: z.number(), rate: z.number() }).optional() })),
  lines: z.array(z.object({ speakerId: z.union([z.string(), z.literal('narrator')]), text: z.string(), audioUrl: z.string().optional(), wordTimings: z.array(z.object({ word: z.string(), startMs: z.number(), endMs: z.number() })).optional() })),
  task: NarrationSchema.optional(), overlays: z.array(z.object({ id: z.string(), text: z.string(), anchor: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }), align: z.enum(['start', 'center', 'end']), style: z.enum(['caption', 'callout', 'label']), maxWidth: z.number().optional(), narration: NarrationSchema.optional() })),
  music: z.object({ profile: z.string() }).optional(), exitAllowed: z.boolean().optional(), rationale: z.object({ differs: z.boolean(), text: z.string() }).optional(), slot: z.string().optional(), autoAdvance: z.boolean().optional(),
});
