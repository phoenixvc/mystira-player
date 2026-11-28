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

  it('exposes assessment and follow-up only when both Spec 2 interactions are enabled', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ mode: 'local', demo: true, interactions: { enabled: ['choices', 'hotspots'] } }) }));
    const demo = await loadLocalDemo();
    expect(demo.assessment?.entries).toEqual({ practice: 'who_said_it', assessment: 'assessment', followUp: 'follow-up' });
    const first = await demo.assessment!.engine.startSession({ activityId: demo.assessment!.activityId, players: [{ type: 'Profile', profileId: demo.assessment!.profiles[0]!.profileId }], startNodeId: demo.assessment!.entries.assessment });
    expect(first.node).toMatchObject({ type: 'check', attempt: 1 });
    const followUp = await demo.assessment!.engine.startSession({ activityId: demo.assessment!.activityId, players: [{ type: 'Profile', profileId: demo.assessment!.profiles[0]!.profileId }], startNodeId: demo.assessment!.entries.followUp });
    expect(followUp.node).toMatchObject({ type: 'check', attempt: 2, scored: false });
  });

  it('exposes the sequence entry only when sequence is enabled and filters to its authored profile', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ mode: 'local', demo: true, interactions: { enabled: ['sequence'] } }) }));
    const demo = await loadLocalDemo();
    expect(demo.assessment?.entries.sequence).toBeTruthy();
    expect(demo.assessment?.entries.practice).toBeUndefined();
    expect(demo.assessment?.entries.assessment).toBeUndefined();
    expect(demo.assessment?.entries.followUp).toBeUndefined();
    expect(demo.assessment?.sequenceProfiles.map((profile) => profile.profileId)).toEqual(['demo_daan']);
    const step = await demo.assessment!.engine.startSession({ activityId: demo.assessment!.activityId, players: [{ type: 'Profile', profileId: 'demo_daan' }], startNodeId: demo.assessment!.entries.sequence });
    expect(step.node.interaction.type).toBe('sequence');
  });
});
