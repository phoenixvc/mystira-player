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

  it('validates bounded sequence items, unique IDs, image alt text, and an exact practice permutation', () => {
    const items = ['eye', 'book', 'ear'].map((id) => ({ id, label: id }));
    const sequence = { ...base, type: 'scene', interaction: { type: 'sequence', items, local: { order: ['eye', 'book', 'ear'] } } };
    expect(createNodeValidator(['sequence']).safeParse(sequence).success).toBe(true);
    expect(NodeSchema.safeParse({ ...sequence, interaction: { ...sequence.interaction, items: [...items, { id: 'four', label: 'Four' }, { id: 'five', label: 'Five' }], local: { order: ['eye', 'book', 'ear', 'four', 'five'] } } }).success).toBe(true);
    expect(createNodeValidator([]).safeParse(sequence).success).toBe(false);
    expect(NodeSchema.safeParse({ ...sequence, interaction: { ...sequence.interaction, items: items.slice(0, 2) } }).success).toBe(false);
    expect(NodeSchema.safeParse({ ...sequence, interaction: { ...sequence.interaction, items: [...items, ...items] } }).success).toBe(false);
    expect(NodeSchema.safeParse({ ...sequence, interaction: { ...sequence.interaction, items: [items[0], items[0], items[2]] } }).success).toBe(false);
    expect(NodeSchema.safeParse({ ...sequence, interaction: { ...sequence.interaction, items: [{ ...items[0], imageUrl: '/eye.webp' }, ...items.slice(1)] } }).success).toBe(false);
    expect(NodeSchema.safeParse({ ...sequence, interaction: { ...sequence.interaction, items: [{ ...items[0], imageUrl: '/eye.webp', alt: 'A child looking' }, ...items.slice(1)] } }).success).toBe(true);
    expect(NodeSchema.safeParse({ ...sequence, interaction: { ...sequence.interaction, local: { order: ['eye', 'eye', 'ear'] } } }).success).toBe(false);
  });

  it('validates inspect part bounds, unique IDs, images, minimum marks, and practice flags', () => {
    const parts = ['sender', 'link', 'price'].map((id) => ({ id, role: 'text', text: id }));
    const inspect = { ...base, type: 'scene', interaction: { type: 'inspect', document: { kind: 'message', title: 'Example', parts }, local: { flagged: ['link'] } } };
    expect(NodeSchema.safeParse(inspect).success).toBe(true);
    expect(createNodeValidator([]).safeParse(inspect).success).toBe(false);
    expect(NodeSchema.safeParse({ ...inspect, interaction: { ...inspect.interaction, document: { ...inspect.interaction.document, parts: parts.slice(0, 2) } } }).success).toBe(false);
    expect(NodeSchema.safeParse({ ...inspect, interaction: { ...inspect.interaction, document: { ...inspect.interaction.document, parts: Array.from({ length: 9 }, (_, id) => ({ id: String(id), role: 'text', text: String(id) })) } } }).success).toBe(false);
    expect(NodeSchema.safeParse({ ...inspect, interaction: { ...inspect.interaction, document: { ...inspect.interaction.document, parts: [parts[0], parts[0], parts[2]] } } }).success).toBe(false);
    expect(NodeSchema.safeParse({ ...inspect, interaction: { ...inspect.interaction, minMarks: 4 } }).success).toBe(false);
    expect(NodeSchema.safeParse({ ...inspect, interaction: { ...inspect.interaction, minMarks: 0, local: { flagged: [] } } }).success).toBe(true);
    expect(NodeSchema.safeParse({ ...inspect, interaction: { ...inspect.interaction, local: { flagged: [] } } }).success).toBe(false);
    expect(NodeSchema.safeParse({ ...inspect, interaction: { ...inspect.interaction, local: { flagged: ['missing'] } } }).success).toBe(false);
    expect(NodeSchema.safeParse({ ...inspect, interaction: { ...inspect.interaction, document: { ...inspect.interaction.document, parts: [{ ...parts[0], imageUrl: '/x.png' }, ...parts.slice(1)] } } }).success).toBe(false);
    expect(NodeSchema.safeParse({ ...inspect, interaction: { ...inspect.interaction, document: { ...inspect.interaction.document, parts: [{ ...parts[0], imageUrl: '/x.png', alt: 'A sender' }, ...parts.slice(1)] } } }).success).toBe(true);
    expect(NodeSchema.safeParse({ ...inspect, interaction: { ...inspect.interaction, document: { ...inspect.interaction.document, parts: [{ id: 'x', role: 'unsupported', text: 'x' }, ...parts.slice(1)] } } }).success).toBe(false);
  });

  it('round trips generated continue nodes without changing their runtime shape', () => {
    for (let seed = 0; seed < 24; seed += 1) {
      const authored = {
        type: 'scene', id: `scene-${seed}`, title: `Scene ${seed}`,
        media: seed % 2 === 0 ? { imageUrl: `/scene-${seed}.webp`, alt: `Scene ${seed}` } : {},
        characters: seed % 3 === 0 ? [{ id: `character-${seed}`, imageUrl: '/character.webp', alt: 'Character', position: 'left' }] : [],
        speakers: [], lines: [{ speakerId: 'narrator', text: `Line ${seed}` }],
        overlays: [], interaction: { type: 'continue', label: seed % 2 === 0 ? 'Onward' : undefined },
        autoAdvance: seed % 4 === 0,
      };
      const first = NodeSchema.parse(authored);
      expect(NodeSchema.parse(JSON.parse(JSON.stringify(first)))).toEqual(first);
    }
  });
});
