import type { Node } from '../schema/node';

export type InteractionMode = 'open' | 'practice' | 'check';

export function interactionMode(node: Node): InteractionMode {
  if (node.type === 'check') return 'check';
  if ('local' in node.interaction && node.interaction.local !== undefined) return 'practice';
  return 'open';
}
