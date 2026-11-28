import { describe, expect, it } from 'vitest';
import { NodeSchema } from '../schema/node';
import { interactionMode } from './interactionMode';
import { practiceFeedback } from './feedbackLadder';

const base = { id: 'n', media: {}, characters: [], speakers: [], lines: [], overlays: [] };

describe('shared interaction mode and feedback', () => {
  it('classifies every node kind with check precedence', () => {
    for (const type of ['scene', 'research', 'result'] as const) {
      const extra = type === 'research' ? { step: 'where' as const } : type === 'result' ? { correctFirstTry: 0, total: 1 } : {};
      expect(interactionMode(NodeSchema.parse({ ...base, ...extra, type, interaction: { type: 'continue' } }))).toBe('open');
      expect(interactionMode(NodeSchema.parse({ ...base, ...extra, type, interaction: { type: 'choices', options: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }], local: { correctId: 'a' } } }))).toBe('practice');
    }
    expect(interactionMode(NodeSchema.parse({ ...base, type: 'check', question: { text: 'Choose' }, attempt: 1, scored: true, interaction: { type: 'choices', options: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }] } }))).toBe('check');
  });

  it('uses keyed, per-try, hint, then built-in feedback and reveals after the threshold', () => {
    const local = { correctId: 'a', outcomes: { b: { onWrong: { text: 'Specific' } } }, feedback: { onWrong: [{ text: 'First' }], hint: { text: 'Hint' }, revealAfter: 2 } };
    expect(practiceFeedback(local, 'b', 1)).toEqual({ message: { text: 'Specific' }, revealTarget: false });
    expect(practiceFeedback(local, 'c', 1).message.text).toBe('First');
    expect(practiceFeedback(local, 'c', 2)).toEqual({ message: { text: 'Hint' }, revealTarget: true });
    expect(practiceFeedback({ correctId: 'a' }, 'b', 1).message.text).toBe('Not yet. Try again.');
  });
});
