import { z } from 'zod';
import { InteractionSchema, type InteractionType } from './interactions';
import { NarrationSchema, SceneBaseSchema } from './node-base';
export { RegionSchema, NarrationSchema } from './node-base';
export type { Region } from './node-base';

const SceneNodeSchema = z.object({ type: z.literal('scene'), interaction: InteractionSchema }).merge(SceneBaseSchema);
const CheckNodeSchema = z.object({ type: z.literal('check'), question: NarrationSchema, interaction: InteractionSchema, attempt: z.union([z.literal(1), z.literal(2)]), scored: z.boolean() }).merge(SceneBaseSchema).extend({ task: z.never().optional(), reveal: z.never().optional() });
const ResearchNodeSchema = z.object({ type: z.literal('research'), step: z.enum(['where', 'find', 'verify', 'use']), source: z.object({ kind: z.enum(['character', 'picture', 'clip', 'chart', 'page']), label: z.string() }).optional(), yourAnswer: z.string().optional(), interaction: InteractionSchema }).merge(SceneBaseSchema);
const ResultNodeSchema = z.object({ type: z.literal('result'), correctFirstTry: z.number().int(), total: z.number().int(), key: z.object({ label: z.string(), iconUrl: z.string() }).optional(), interaction: InteractionSchema }).merge(SceneBaseSchema);
const NodeUnionSchema = z.discriminatedUnion('type', [SceneNodeSchema, CheckNodeSchema, ResearchNodeSchema, ResultNodeSchema]);
export type Node = z.infer<typeof NodeUnionSchema>;
export type SceneNode = z.infer<typeof SceneNodeSchema>;
export type CheckNode = z.infer<typeof CheckNodeSchema>;
export type ResearchNode = z.infer<typeof ResearchNodeSchema>;
export type ResultNode = z.infer<typeof ResultNodeSchema>;

function addNodeInvariants(node: Node, ctx: z.RefinementCtx): void {
  const slots = new Set<string>();
  for (const character of node.characters) {
    if (slots.has(character.position)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['characters'], message: `Duplicate character slot: ${character.position}` });
    slots.add(character.position);
  }
  if (node.characters.length > 3) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['characters'], message: 'A scene may have at most 3 characters' });
  if (node.interaction.type === 'choices' || node.interaction.type === 'hotspots') {
    const items = node.interaction.type === 'choices' ? node.interaction.options : node.interaction.spots;
    const ids = items.map((item) => item.id);
    if (new Set(ids).size !== ids.length) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['interaction'], message: 'Answer IDs must be unique' });
    if (node.interaction.local) {
      if (!ids.includes(node.interaction.local.correctId)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['interaction', 'local', 'correctId'], message: 'Correct ID must match an answer' });
      for (const [id, outcome] of Object.entries(node.interaction.local.outcomes ?? {})) {
        if (!ids.includes(id)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['interaction', 'local', 'outcomes', id], message: 'Outcome ID must match an answer' });
        if ('onCorrect' in outcome && id !== node.interaction.local.correctId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['interaction', 'local', 'outcomes', id], message: 'Correct presentation must match the correct answer' });
        if ('onWrong' in outcome && id === node.interaction.local.correctId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['interaction', 'local', 'outcomes', id], message: 'Wrong feedback cannot match the correct answer' });
      }
    }
    if (node.interaction.type === 'hotspots') for (const spot of node.interaction.spots) {
      if (spot.region.shape === 'rect' && (spot.region.x + spot.region.w > 1 || spot.region.y + spot.region.h > 1 || spot.region.w <= 0 || spot.region.h <= 0)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['interaction', 'spots'], message: 'Hotspot bounds must be inside the image' });
      if (spot.region.shape === 'circle' && (spot.region.x - spot.region.r < 0 || spot.region.y - spot.region.r < 0 || spot.region.x + spot.region.r > 1 || spot.region.y + spot.region.r > 1 || spot.region.r <= 0)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['interaction', 'spots'], message: 'Hotspot circle must be inside the image' });
    }
  }
  if (node.interaction.type === 'sequence') {
    const ids = node.interaction.items.map((item) => item.id);
    if (new Set(ids).size !== ids.length) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['interaction', 'items'], message: 'Sequence item IDs must be unique' });
    const order = node.interaction.local?.order;
    if (order && (order.length !== ids.length || new Set(order).size !== ids.length || order.some((id) => !ids.includes(id)))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['interaction', 'local', 'order'], message: 'Practice order must contain every sequence item exactly once' });
    }
  }
  if (node.type !== 'check') return;
  if ('local' in node.interaction && node.interaction.local !== undefined) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['interaction', 'local'], message: 'Check nodes must not carry a local answer block' });
  if (node.interaction.type === 'hotspots' && node.interaction.spots.some((spot) => spot.reveal !== undefined)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['interaction', 'spots'], message: 'Check nodes must not carry reveal content' });
  if (node.attempt === 2 && node.scored) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['scored'], message: 'A check at attempt 2 must not be scored' });
}
export const NodeSchema = NodeUnionSchema.superRefine(addNodeInvariants);
export const validateNode = NodeSchema;
export function createNodeValidator(enabled: InteractionType[]) {
  const allowed = new Set<InteractionType>(['continue', ...enabled]);
  return NodeSchema.superRefine((node, ctx) => {
    if (!allowed.has(node.interaction.type)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['interaction', 'type'], message: `Unsupported interaction: ${node.interaction.type}` });
  });
}
