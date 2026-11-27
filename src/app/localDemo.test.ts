import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadLocalDemo } from './localDemo';

afterEach(() => vi.unstubAllGlobals());

describe('local demo bootstrap', () => {
  it('loads the runtime config and plays the continue-only YAML path', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ mode: 'local', demo: true, interactions: { enabled: [] } }) }));
    const { engine, activityId } = await loadLocalDemo();
    const first = await engine.startSession({ activityId, players: [] });
    expect(first.node.interaction.type).toBe('continue');
    expect(first.node.id).toBe('arrive');
    const next = await engine.respond(first.sessionId, { answerRequestId: 'continue-1', version: first.version, nodeId: first.node.id, answer: { kind: 'continue' } });
    expect(next.node.id).toBe('remember');
  });
});
