import { describe, expect, it, vi } from 'vitest';
import { BlazorInteropEngine } from './BlazorInteropEngine';
import { EngineError } from '../types';

const step = {
  sessionId: 'session-1', version: '2', ageGroupId: '6-9', players: [], canGoBack: false,
  node: { id: 'sniff', type: 'scene', media: {}, characters: [], speakers: [], lines: [], overlays: [], interaction: { type: 'roll', state: 'resolved', target: 3, result: { value: 2, success: false, message: 'A gentle miss.' } } },
};

describe('BlazorInteropEngine', () => {
  it('forwards the complete idempotent submission to the authorized host and validates its step', async () => {
    const invokeMethodAsync = vi.fn().mockResolvedValue({ step });
    const engine = new BlazorInteropEngine({ invokeMethodAsync });
    const submission = { answerRequestId: 'stable-request', nodeId: 'sniff', version: '1', answer: { kind: 'roll' as const }, playerId: 'guest-1' };
    expect(await engine.respond('session-1', submission)).toMatchObject(step);
    expect(invokeMethodAsync).toHaveBeenCalledWith('PlayerRespond', 'session-1', submission);
    expect(invokeMethodAsync).toHaveBeenCalledTimes(1);
  });

  it('preserves a host conflict step for authoritative refresh', async () => {
    const engine = new BlazorInteropEngine({ invokeMethodAsync: vi.fn().mockResolvedValue({ error: { kind: 'conflict', message: 'Scene moved', currentStep: step } }) });
    await expect(engine.resumeSession('session-1')).rejects.toMatchObject({ kind: 'conflict', currentStep: step });
  });

  it('rejects malformed host steps and does not invoke an aborted request', async () => {
    const invokeMethodAsync = vi.fn().mockResolvedValue({ step: { ...step, node: { ...step.node, interaction: { type: 'roll', state: 'resolved' } } } });
    const engine = new BlazorInteropEngine({ invokeMethodAsync });
    await expect(engine.resumeSession('session-1')).rejects.toMatchObject({ kind: 'unsupported' });
    const controller = new AbortController();
    controller.abort();
    await expect(engine.resumeSession('session-1', { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expect(invokeMethodAsync).toHaveBeenCalledTimes(1);
  });

  it('contains .NET exceptions without exposing host data', async () => {
    const engine = new BlazorInteropEngine({ invokeMethodAsync: vi.fn().mockRejectedValue(new Error('private server detail')) });
    await expect(engine.resumeSession('session-1')).rejects.toEqual(new EngineError('server', 'The story host could not complete this action.'));
  });
});
