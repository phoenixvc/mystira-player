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
