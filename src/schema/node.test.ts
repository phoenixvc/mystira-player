import { describe, expect, it } from 'vitest';
import { createNodeValidator, NodeSchema, validateNode } from './node';

const base = {
  id: 'check-1', title: 'A check',
  media: {}, characters: [], speakers: [], lines: [], overlays: [],
  type: 'check' as const,
  question: { text: 'Which one?' },
  interaction: { type: 'choices' as const, options: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }] },
  attempt: 1 as const, scored: true,
};

describe('node validation', () => {
  it('rejects check nodes with local answers, reveal content, or scoring on attempt two', () => {
    expect(NodeSchema.safeParse({ ...base, interaction: { ...base.interaction, local: { correctId: 'a' } } }).success).toBe(false);
    expect(validateNode.safeParse({ ...base, interaction: { ...base.interaction, local: { correctId: 'a' } } }).success).toBe(false);
    expect(NodeSchema.safeParse({ ...base, reveal: { text: 'Answer' } }).success).toBe(false);
    expect(validateNode.safeParse({ ...base, interaction: { type: 'hotspots', spots: [
      { id: 'a', label: 'A', region: { shape: 'rect', x: 0, y: 0, w: 0.2, h: 0.2 }, reveal: { text: 'Found' } },
      { id: 'b', label: 'B', region: { shape: 'rect', x: 0.3, y: 0.3, w: 0.2, h: 0.2 } },
    ] } }).success).toBe(false);
    expect(validateNode.safeParse({ ...base, attempt: 2, scored: true }).success).toBe(false);
  });

  it('rejects duplicate character slots', () => {
    const characters = [
      { id: 'one', imageUrl: '/one.png', alt: 'One', position: 'left' },
      { id: 'two', imageUrl: '/two.png', alt: 'Two', position: 'left' },
    ];
    expect(validateNode.safeParse({ ...base, characters }).success).toBe(false);
  });

  it('rejects interactions that are not enabled for this player', () => {
    expect(createNodeValidator([]).safeParse(base).success).toBe(false);
    expect(createNodeValidator(['choices']).safeParse(base).success).toBe(true);
  });
});
