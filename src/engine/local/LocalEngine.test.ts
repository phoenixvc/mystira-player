import { describe, expect, it } from 'vitest';
import { LocalEngine } from './LocalEngine';
import type { StoryYaml } from '../../schema/story-yaml';

const story = {
  title: 'Demo', description: '', image: '', tags: [], difficulty: 'Easy', session_length: 'Short',
  age_group: '6-9', minimum_age: 6, core_axes: {}, archetypes: [], characters: [],
  scenes: [
    { id: 'opening', title: 'Opening', type: 'narrative', active_character: null, description: 'Start', next_scene: 'choice', difficulty: null, media: { image: null, audio: null, video: null }, branches: [], metadata: {} },
    { id: 'choice', title: 'Choice', type: 'choice', active_character: null, description: 'Choose', next_scene: null, difficulty: null, media: { image: null, audio: null, video: null }, branches: [{ id: 'yes', choice: 'Yes', next_scene: null }, { id: 'no', choice: 'No', next_scene: null }], metadata: {} },
    { id: 'alternate', title: 'Alternate', type: 'narrative', active_character: null, description: 'Alternate', next_scene: null, difficulty: null, media: { image: null, audio: null, video: null }, branches: [], metadata: {} },
  ],
  lesson: { id: 'lesson', title: 'Lesson', pieces: [{ id: 'piece', title: 'Piece', versions: [
    { id: 'base', scenes: ['opening', 'choice'] }, { id: 'alternate', scenes: ['alternate'] },
  ] }] },
  demo: { profiles: [
    { id: 'base-profile', display_name: 'Base', versions: { piece: 'base' } },
    { id: 'alternate-profile', display_name: 'Alternate', versions: { piece: 'alternate' } },
  ] },
} satisfies StoryYaml;

function start(engine: LocalEngine, profileId: string) {
  return engine.startSession({ activityId: 'lesson', players: [{ type: 'Profile', profileId }] });
}

describe('LocalEngine', () => {
  it('uses the selected profile version', async () => {
    const engine = new LocalEngine(story, ['choices']);
    const step = await start(engine, 'alternate-profile');
    expect(step.node.id).toBe('alternate');
    expect(step.node.lines[0]?.text).toBe('Alternate');
  });

  it('maps a demo child switch to the same lesson piece in the other version', () => {
    const engine = new LocalEngine(story, ['choices']);
    expect(engine.demoSceneForProfile('choice', 'alternate-profile')).toBe('alternate');
    expect(engine.demoSceneForProfile('alternate', 'base-profile')).toBe('opening');
  });

  it('starts at a requested scene only when it belongs to the selected profile path', async () => {
    const engine = new LocalEngine(story, ['choices']);
    const selected = await engine.startSession({ activityId: 'lesson', players: [{ type: 'Profile', profileId: 'base-profile' }], startNodeId: 'choice' });
    expect(selected.node.id).toBe('choice');
    expect(selected.canGoBack).toBe(false);
    await expect(engine.startSession({ activityId: 'lesson', players: [{ type: 'Profile', profileId: 'base-profile' }], startNodeId: 'alternate' }))
      .rejects.toMatchObject({ kind: 'notFound' });
  });

  it('accepts supported answers and replays an idempotent request', async () => {
    const engine = new LocalEngine(story, ['choices']);
    const first = await start(engine, 'base-profile');
    const next = await engine.respond(first.sessionId, {
      answerRequestId: 'request-1', version: first.version, nodeId: first.node.id, answer: { kind: 'continue' },
    });
    const replay = await engine.respond(first.sessionId, {
      answerRequestId: 'request-1', version: first.version, nodeId: first.node.id, answer: { kind: 'continue' },
    });
    expect(next.node.id).toBe('choice');
    expect(replay).toBe(next);
  });

  it('returns a conflict with the current step for a stale version', async () => {
    const engine = new LocalEngine(story, ['choices']);
    const first = await start(engine, 'base-profile');
    const current = await engine.respond(first.sessionId, { answerRequestId: 'r1', version: first.version, nodeId: first.node.id, answer: { kind: 'continue' } });
    await expect(engine.respond(first.sessionId, { answerRequestId: 'r2', version: first.version, nodeId: current.node.id, answer: { kind: 'continue' } }))
      .rejects.toMatchObject({ kind: 'conflict', currentStep: current });
  });

  it('supports going back to the previous scene', async () => {
    const engine = new LocalEngine(story, ['choices']);
    const first = await start(engine, 'base-profile');
    const current = await engine.respond(first.sessionId, { answerRequestId: 'r1', version: first.version, nodeId: first.node.id, answer: { kind: 'continue' } });
    const previous = await engine.respond(first.sessionId, { answerRequestId: 'r2', version: current.version, nodeId: current.node.id, answer: { kind: 'back' } });
    expect(previous.node.id).toBe('opening');
    expect(previous.canGoBack).toBe(false);
  });

  it('follows a branch target and returns through actual navigation history', async () => {
    const branching: StoryYaml = { ...story, lesson: undefined, scenes: [
      { ...story.scenes[1]!, branches: [
        { id: 'skip', choice: 'Skip', next_scene: 'alternate' },
        { id: 'first', choice: 'First', next_scene: 'opening' },
      ] },
      story.scenes[0]!, story.scenes[2]!,
    ] };
    const engine = new LocalEngine(branching, ['choices']);
    const first = await engine.startSession({ activityId: 'Demo', players: [{ type: 'Profile', profileId: 'base-profile' }] });
    const next = await engine.respond(first.sessionId, { answerRequestId: 'branch', version: first.version, nodeId: first.node.id, answer: { kind: 'choice', choiceId: 'skip' } });
    expect(next.node.id).toBe('alternate');
    const previous = await engine.respond(first.sessionId, { answerRequestId: 'back', version: next.version, nodeId: next.node.id, answer: { kind: 'back' } });
    expect(previous.node.id).toBe('choice');
  });

  it('does not redirect an explicit target into the selected version', async () => {
    const crossVersion: StoryYaml = {
      ...story,
      scenes: story.scenes.map((scene) => scene.id === 'opening' ? { ...scene, next_scene: 'alternate' } : scene),
    };
    const engine = new LocalEngine(crossVersion);
    const first = await start(engine, 'base-profile');
    await expect(engine.respond(first.sessionId, {
      answerRequestId: 'cross-version', version: first.version, nodeId: first.node.id, answer: { kind: 'continue' },
    })).rejects.toMatchObject({ kind: 'unsupported', message: expect.stringContaining("unavailable scene 'alternate'") });
    expect((await engine.resumeSession(first.sessionId)).node.id).toBe('opening');
  });

  it('keeps the current scene and version when the next interaction is unavailable', async () => {
    const engine = new LocalEngine(story);
    const first = await start(engine, 'base-profile');
    const submission = { answerRequestId: 'unsupported-next', version: first.version, nodeId: first.node.id, answer: { kind: 'continue' as const } };
    await expect(engine.respond(first.sessionId, submission)).rejects.toMatchObject({ kind: 'unsupported' });
    expect(await engine.resumeSession(first.sessionId)).toEqual(first);
    await expect(engine.respond(first.sessionId, submission)).rejects.toMatchObject({ kind: 'unsupported' });
    expect(await engine.resumeSession(first.sessionId)).toEqual(first);
  });

  it('does not advance from lesson pieces to a result while a check is unimplemented', async () => {
    const withCheck: StoryYaml = { ...story, lesson: { ...story.lesson!, checks: [{ id: 'assessment', questions: [{ id: 'q1', scene: 'alternate', answer: { branch: 'yes' } }] }], result: { scene: 'alternate' } } };
    const engine = new LocalEngine(withCheck, ['choices']);
    const first = await start(engine, 'alternate-profile');
    await expect(engine.respond(first.sessionId, { answerRequestId: 'end', version: first.version, nodeId: first.node.id, answer: { kind: 'continue' } }))
      .rejects.toMatchObject({ kind: 'unsupported', message: expect.stringContaining('cannot be skipped') });
    expect((await engine.resumeSession(first.sessionId)).node.id).toBe('alternate');
  });

  it('finishes a continue-only path and allows Back from the end view', async () => {
    const engine = new LocalEngine(story);
    const first = await start(engine, 'alternate-profile');
    const end = await engine.respond(first.sessionId, { answerRequestId: 'finish', version: first.version, nodeId: first.node.id, answer: { kind: 'continue' } });
    expect(end.node.type).toBe('result');
    expect(end.progress).toEqual({ done: 1, total: 1 });
    const returned = await engine.respond(first.sessionId, { answerRequestId: 'return', version: end.version, nodeId: end.node.id, answer: { kind: 'back' } });
    expect(returned.node.id).toBe('alternate');
  });

  it('marks both sides of a profile-specific version as different', async () => {
    const withRationale: StoryYaml = { ...story, demo: { profiles: story.demo!.profiles.map((profile) => ({ ...profile, rationale: { piece: 'Chosen for this profile.' } })) } };
    const engine = new LocalEngine(withRationale, ['choices']);
    expect((await start(engine, 'base-profile')).node.rationale?.differs).toBe(true);
    expect((await start(engine, 'alternate-profile')).node.rationale?.differs).toBe(true);
  });

  it('preserves replay, conflict, progress and Back invariants across linear path lengths', async () => {
    for (let length = 1; length <= 12; length += 1) {
      const linear: StoryYaml = {
        ...story, lesson: undefined,
        scenes: Array.from({ length }, (_, index) => ({
          ...story.scenes[0]!, id: `scene-${index}`, title: `Scene ${index}`,
          next_scene: index + 1 < length ? `scene-${index + 1}` : null,
        })),
      };
      const engine = new LocalEngine(linear);
      let current = await engine.startSession({ activityId: 'Demo', players: [{ type: 'Profile', profileId: 'base-profile' }] });
      for (let index = 0; index < length; index += 1) {
        const submission = { answerRequestId: `length-${length}-step-${index}`, version: current.version, nodeId: current.node.id, answer: { kind: 'continue' as const } };
        const next = await engine.respond(current.sessionId, submission);
        expect(next.progress).toEqual({ done: index + 1, total: length });
        expect(await engine.respond(current.sessionId, submission)).toBe(next);
        expect(await engine.resumeSession(current.sessionId)).toEqual(next);
        await expect(engine.respond(current.sessionId, { ...submission, answerRequestId: `stale-${index}`, nodeId: next.node.id }))
          .rejects.toMatchObject({ kind: 'conflict', currentStep: next });
        current = next;
      }
      expect(current.node.type).toBe('result');
      const back = await engine.respond(current.sessionId, { answerRequestId: `back-${length}`, version: current.version, nodeId: current.node.id, answer: { kind: 'back' } });
      expect(back.node.id).toBe(`scene-${length - 1}`);
    }
  });

  it('lets a child-chooses profile select lesson pieces without forcing fixed order', async () => {
    const choosing: StoryYaml = {
      ...story,
      scenes: story.scenes.map((scene) => scene.id === 'opening' ? { ...scene, next_scene: 'alternate' } : scene),
      lesson: { id: 'lesson', title: 'Lesson', pieces: [
        { id: 'first', title: 'First piece', scenes: ['opening'] },
        { id: 'second', title: 'Second piece', scenes: ['alternate'] },
      ], checks: [{ id: 'assessment', questions: [{ id: 'q1', scene: 'choice', answer: { branch: 'yes' } }] }] },
      demo: { profiles: [{ id: 'chooser', display_name: 'Chooser', order: 'child_chooses' }] },
    };
    const engine = new LocalEngine(choosing);
    expect(engine.demoPiecesForProfile('chooser')).toEqual([
      { id: 'first', title: 'First piece', startSceneId: 'opening' },
      { id: 'second', title: 'Second piece', startSceneId: 'alternate' },
    ]);
    await expect(start(engine, 'chooser')).rejects.toMatchObject({ kind: 'unsupported', message: expect.stringContaining('Choose a lesson piece') });
    const secondFirst = await engine.startSession({ activityId: 'lesson', players: [{ type: 'Profile', profileId: 'chooser' }], startNodeId: 'alternate' });
    expect(secondFirst.node.id).toBe('alternate');
    const secondEnd = await engine.respond(secondFirst.sessionId, { answerRequestId: 'second-end', version: secondFirst.version, nodeId: secondFirst.node.id, answer: { kind: 'continue' } });
    expect(secondEnd.node.type).toBe('result');
    expect(secondEnd.node.title).toBe('Piece complete');
    const firstNext = await engine.startSession({ activityId: 'lesson', players: [{ type: 'Profile', profileId: 'chooser' }], startNodeId: 'opening' });
    expect(firstNext.node.id).toBe('opening');
    const firstEnd = await engine.respond(firstNext.sessionId, { answerRequestId: 'first-end', version: firstNext.version, nodeId: firstNext.node.id, answer: { kind: 'continue' } });
    expect(firstEnd.node.type).toBe('result');
  });
});
