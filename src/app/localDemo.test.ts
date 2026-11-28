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

  it('exposes the fictional inspect piece with inspect enabled alone', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ mode: 'local', demo: true, interactions: { enabled: ['inspect'] } }) }));
    const demo = await loadLocalDemo();
    expect(demo.assessment?.entries).toEqual({ inspect: 'what_do_they_want' });
    const first = await demo.assessment!.engine.startSession({ activityId: demo.assessment!.activityId, players: [{ type: 'Profile', profileId: 'demo_daan' }], startNodeId: demo.assessment!.entries.inspect });
    expect(first.node.interaction.type).toBe('inspect');
    if (first.node.interaction.type !== 'inspect') throw new Error('Expected inspect');
    const document = first.node.interaction.document;
    expect(document.parts.find((part) => part.role === 'link')?.text).toContain('password');
    for (const part of document.parts) {
      const domains = part.text.match(/\b[a-z][a-z0-9-]*\.[a-z][a-z0-9.-]*\b/gi) ?? [];
      expect(domains.every((domain) => domain.endsWith('.example'))).toBe(true);
    }
    const fixed = await demo.assessment!.engine.startSession({ activityId: demo.assessment!.activityId, players: [{ type: 'Profile', profileId: 'demo_lerato' }], startNodeId: demo.assessment!.entries.inspect });
    const completed = await demo.assessment!.engine.respond(fixed.sessionId, { answerRequestId: 'inspect-only', version: fixed.version, nodeId: fixed.node.id, answer: { kind: 'inspect', partIds: ['link', 'price'] } });
    expect(completed.node).toMatchObject({ type: 'result', title: 'Piece complete' });
  });
});
