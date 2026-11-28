import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import fireDoorYaml from '../../content/manor/fire-door.story.yaml?raw';
import { LocalEngine } from '../engine/local/LocalEngine';
import { StoryYamlSchema } from '../schema/story-yaml';
import type { Answer, Step } from '../engine/types';
import { stageMummysParty } from './mummysPartyStaging';

const story = StoryYamlSchema.parse(parse(fireDoorYaml));

function correctAnswer(step: Step): Answer {
  const interaction = step.node.interaction;
  switch (interaction.type) {
    case 'continue': return { kind: 'continue' };
    case 'choices': return { kind: 'choice', choiceId: interaction.local?.correctId ?? interaction.options[0]!.id };
    case 'hotspots': return { kind: 'hotspot', hotspotId: interaction.local?.correctId ?? interaction.spots[0]!.id };
    case 'sequence': return { kind: 'sequence', itemIds: interaction.local?.order ?? interaction.items.map((item) => item.id) };
    case 'inspect': return { kind: 'inspect', partIds: interaction.local?.flagged ?? interaction.document.parts.slice(0, interaction.minMarks).map((part) => part.id) };
    default: throw new Error(`Unsupported demo interaction: ${interaction.type}`);
  }
}

describe("Mummy's Party draft", () => {
  it('loads the two child paths from the supplied story', async () => {
    const engine = new LocalEngine(story, ['choices', 'hotspots', 'sequence', 'inspect']);
    expect((await engine.listProfiles()).map((profile) => profile.displayName)).toEqual(['Zoe', 'Max']);
    for (const profileId of ['demo_zoe', 'demo_max']) {
      const opening = await engine.startSession({ activityId: 'fire_door', players: [{ type: 'Profile', profileId }] });
      expect(opening.node.id).toBe('opening_video');
      const next = await engine.respond(opening.sessionId, { answerRequestId: `${profileId}-opening`, version: opening.version, nodeId: opening.node.id, answer: { kind: 'continue' } });
      expect(next.node.id).toBe(profileId === 'demo_zoe' ? 'spot_table' : 'max_s1_01');
      if (profileId === 'demo_zoe') {
        expect(next.node.interaction.type).toBe('hotspots');
        if (next.node.interaction.type !== 'hotspots') throw new Error('Expected hotspots');
        const correctId = next.node.interaction.local?.correctId;
        expect(correctId).toBeTruthy();
        const outcome = await engine.respond(next.sessionId, { answerRequestId: 'zoe-spot', version: next.version, nodeId: next.node.id, answer: { kind: 'hotspot', hotspotId: correctId! } });
        expect(outcome.node.id).toBe('spot_table_after');
      }
    }
  });

  it.each(['demo_zoe', 'demo_max'])('reaches the end of %s’s lesson path', async (profileId) => {
    const engine = new LocalEngine(story, ['choices', 'hotspots', 'sequence', 'inspect']);
    let step = await engine.startSession({ activityId: 'fire_door', players: [{ type: 'Profile', profileId }] });
    const visited: string[] = [];
    for (let i = 0; i < 80 && step.node.id !== 'story-end'; i++) {
      visited.push(step.node.id);
      step = await engine.respond(step.sessionId, { answerRequestId: `${profileId}-${i}`, version: step.version, nodeId: step.node.id, answer: correctAnswer(step) });
    }
    expect(step.node.id).toBe('story-end');
    expect(visited).toContain('closing_video');
  });

  it('stages the video-informed party and garden props with matching ghost glow', () => {
    const spot = story.scenes.find((scene) => scene.id === 'spot_table')!;
    const closing = story.scenes.find((scene) => scene.id === 'result')!;
    const party = stageMummysParty(spot);
    const garden = stageMummysParty(closing);
    expect(party.layers?.some((layer) => layer.id === 'ghost-glow' && layer.imageUrl.endsWith('ghost-pointing-glow.svg'))).toBe(true);
    expect(party.layers?.some((layer) => layer.id === 'sofa' && layer.left >= 70)).toBe(true);
    expect(garden.layers?.find((layer) => layer.id === 'fire-engine')?.left).toBe(80);
    expect(party.imageForCast?.('/mummys-party/characters/ghost.png', 'worried')).toBe('/mummys-party/poses/ghost/ghost-worried.png');
    expect(party.layers?.find((layer) => layer.id === 'ghost-glow')?.left).toBe(8.5);
    const smoky = stageMummysParty(story.scenes.find((scene) => scene.id === 'zoe_s3_08')!);
    expect(smoky.layers?.find((layer) => layer.id === 'smoke-ceiling')?.overlay).toBe(true);
    const shop = stageMummysParty(story.scenes.find((scene) => scene.id === 'q3')!);
    expect(shop.layers?.some((layer) => layer.id === 'smoke-alarm')).toBe(false);
  });

  it('completes the separate assessment with all three first answers correct', async () => {
    const engine = new LocalEngine(story, ['choices', 'hotspots', 'sequence', 'inspect']);
    let step = await engine.startSession({ activityId: 'fire_door', players: [{ type: 'Profile', profileId: 'demo_zoe' }], startNodeId: 'assessment' });
    expect(step.node.id).toBe('q1');
    for (const question of story.lesson!.checks!.flatMap((check) => check.questions)) {
      expect(step.node.id).toBe(question.scene);
      step = await engine.respond(step.sessionId, { answerRequestId: `assessment-${question.id}`, version: step.version, nodeId: step.node.id, answer: { kind: 'choice', choiceId: question.answer.branch! } });
    }
    expect(step.node.id).toBe('result');
    expect(step.node.type).toBe('result');
  });
});
