import { createNodeValidator, type Node } from '../../schema/node';
import type { InteractionType } from '../../schema/interactions';
import type { SceneYaml, StoryYaml } from '../../schema/story-yaml';
import { EngineError } from '../types';

const FALLBACK_COLOUR = '#A9C0DC';

export function compileScene(scene: SceneYaml, story: StoryYaml, enabled: InteractionType[] = [], profileId?: string, sequenceOrder?: string[]): Node {
  if (scene.type === 'roll' || scene.type === 'special' || (scene.media.stage3d != null && scene.media.image == null && scene.media.video == null)) {
    throw new EngineError('unsupported', `Scene '${scene.id}' uses an unsupported 3D or special presentation.`);
  }
  const interactionKind = typeof scene.interaction === 'object' && scene.interaction !== null && 'kind' in scene.interaction
    ? scene.interaction.kind : undefined;
  if (interactionKind !== undefined && interactionKind !== 'sequence' && interactionKind !== 'inspect') {
    throw new EngineError('unsupported', `Scene '${scene.id}' interaction '${String(interactionKind)}' is not implemented yet.`);
  }

  const cast = (scene.cast ?? []).flatMap((member) => {
    const character = story.characters.find((entry) => entry.id === member.character_id);
    if (!character || !character.image) return [];
    return [{ id: character.id, imageUrl: character.image, alt: character.name, position: member.slot, ...(member.pose ? { pose: member.pose } : {}), ...(member.reactions ? { reactions: member.reactions } : {}) }];
  });
  const speakers = story.characters.map((character) => ({
    id: character.id, name: character.name, colour: character.colour ?? FALLBACK_COLOUR,
    ...(character.image ? { avatarUrl: character.image } : {}), ...(character.voice ? { voice: character.voice } : {}),
  }));
  const lines = scene.lines?.length
    ? scene.lines.map((line) => ({ speakerId: line.speaker, text: line.text, ...(line.audio ? { audioUrl: line.audio } : {}) }))
    : [{ speakerId: 'narrator' as const, text: scene.description, ...(scene.media.audio ? { audioUrl: scene.media.audio } : {}) }];
  const task = scene.task ? { text: scene.task.text, ...(scene.task.audio ? { audioUrl: scene.task.audio } : {}) } : undefined;
  const overlays = (scene.overlays ?? []).map((overlay) => ({
    id: overlay.id, text: overlay.text, anchor: { x: overlay.x, y: overlay.y },
    align: overlay.align ?? 'center', style: overlay.style ?? 'caption',
    ...(overlay.max_width === undefined ? {} : { maxWidth: overlay.max_width }),
  }));
  const profile = story.demo?.profiles.find((candidate) => candidate.id === profileId);
  const piece = story.lesson?.pieces.find((candidate) => candidate.scenes?.includes(scene.id) || candidate.versions?.some((version) => version.scenes.includes(scene.id)));
  const differsByProfile = piece !== undefined && new Set((story.demo?.profiles ?? []).map((candidate) => candidate.versions?.[piece.id] ?? piece.versions?.[0]?.id ?? '')).size > 1;
  const rationaleText = piece ? profile?.rationale?.[piece.id] : undefined;
  const interaction = buildInteraction(scene, sequenceOrder);
  const node = {
    type: 'scene' as const, id: scene.id, title: scene.title,
    media: {
      ...(scene.media.image ? { imageUrl: scene.media.image, alt: scene.title } : {}),
      ...(scene.media.video ? { video: { url: scene.media.video, onEnd: 'stop' as const, skippable: true } } : {}),
    },
    characters: cast, speakers, lines, ...(task ? { task } : {}), overlays,
    ...(scene.exit_allowed === undefined ? {} : { exitAllowed: scene.exit_allowed }),
    ...(rationaleText ? { rationale: { differs: differsByProfile, text: rationaleText } } : {}),
    ...(scene.host_slot ? { slot: scene.host_slot } : {}), ...(scene.auto_advance === undefined ? {} : { autoAdvance: scene.auto_advance }),
    ...(scene.music ? { music: { profile: scene.music.profile } } : {}),
    interaction,
  };
  const parsed = createNodeValidator(enabled).safeParse(node);
  if (!parsed.success) {
    const unsupported = parsed.error.issues.find((issue) => issue.path.join('.') === 'interaction.type' && issue.message.startsWith('Unsupported'));
    if (unsupported) throw new EngineError('unsupported', unsupported.message);
    throw new EngineError('server', `Invalid node compiled from '${scene.id}': ${parsed.error.message}`);
  }
  return parsed.data;
}

function buildInteraction(scene: SceneYaml, sequenceOrder?: string[]) {
  if (scene.interaction?.kind === 'inspect') {
    if (scene.branches.length) throw new EngineError('server', `Scene '${scene.id}' cannot mix inspect parts and branches.`);
    const document = scene.interaction.document;
    const flagged = scene.practice?.answer.parts;
    const local = flagged ? { flagged, ...(feedbackFor(scene) ? { feedback: feedbackFor(scene) } : {}) } : undefined;
    return { type: 'inspect' as const, document: { kind: document.kind, title: document.title, parts: document.parts.map((part) => ({ id: part.id, role: part.role, text: part.text, ...(part.image ? { imageUrl: part.image, alt: part.alt } : {}) })) }, minMarks: scene.interaction.min_marks ?? 1, ...(local ? { local } : {}) };
  }
  if (scene.interaction?.kind === 'sequence') {
    if (scene.branches.length) throw new EngineError('server', `Scene '${scene.id}' cannot mix sequence items and branches.`);
    const authored = scene.interaction.items;
    const ids = authored.map((item) => item.id);
    const order = sequenceOrder ?? ids;
    if (order.length !== ids.length || new Set(order).size !== ids.length || order.some((id) => !ids.includes(id))) {
      throw new EngineError('server', `Scene '${scene.id}' has an invalid Engine-supplied sequence order.`);
    }
    const items = order.map((id) => {
      const item = authored.find((entry) => entry.id === id)!;
      return { id: item.id, label: item.label, ...(item.image ? { imageUrl: item.image, alt: item.alt } : {}) };
    });
    const practiceOrder = scene.practice?.answer.order;
    const local = practiceOrder ? { order: practiceOrder, ...(feedbackFor(scene) ? { feedback: feedbackFor(scene) } : {}) } : undefined;
    return { type: 'sequence' as const, items, ...(local ? { local } : {}) };
  }
  const branches = scene.branches;
  if (branches.length) {
    const answer = scene.practice?.answer;
    if (branches.some((branch) => branch.object_id != null)) {
      const objects = new Map((scene.objects ?? []).map((object) => [object.id, object]));
      const spots = branches.map((branch) => {
        if (!branch.object_id) throw new EngineError('server', `Scene '${scene.id}' mixes object and choice branches.`);
        const object = objects.get(branch.object_id);
        const bounds = object?.geometry?.bounds;
        if (!bounds || bounds.length < 4) throw new EngineError('server', `Scene '${scene.id}' object '${branch.object_id}' has no rectangular bounds.`);
        const [x, y, w, h] = bounds;
        if (x === undefined || y === undefined || w === undefined || h === undefined) throw new EngineError('server', `Scene '${scene.id}' has invalid bounds.`);
        return { id: branch.object_id, label: object.label ?? branch.choice, region: { shape: 'rect' as const, x, y, w, h }, ...(object.reveal ? { reveal: { text: object.reveal.text, ...(object.reveal.image ? { imageUrl: object.reveal.image } : {}) } } : {}) };
      });
      const outcomes = outcomesFor(scene, spots.map((spot) => spot.id), answer?.object, true);
      const local = answer?.object ? { correctId: answer.object, ...(feedbackFor(scene) ? { feedback: feedbackFor(scene) } : {}), ...(outcomes ? { outcomes } : {}) } : undefined;
      return { type: 'hotspots' as const, spots, ...(local ? { local } : {}) };
    }
    const options = branches.map((branch, index) => ({ id: branch.id ?? `choice-${index + 1}`, label: branch.choice }));
    const correctId = answer?.branch ? options.find((option) => option.id === answer.branch)?.id : undefined;
    if (answer?.branch && !correctId) throw new EngineError('server', `Scene '${scene.id}' practice answer refers to missing branch '${answer.branch}'.`);
    const outcomes = outcomesFor(scene, options.map((option) => option.id), correctId, false);
    const local = correctId ? { correctId, ...(feedbackFor(scene) ? { feedback: feedbackFor(scene) } : {}), ...(outcomes ? { outcomes } : {}) } : undefined;
    return { type: 'choices' as const, options, ...(local ? { local } : {}) };
  }
  return { type: 'continue' as const };
}

function feedbackFor(scene: SceneYaml) {
  const practice = scene.practice;
  if (!practice || (!practice.hint && !practice.on_wrong && practice.reveal_after === undefined)) return undefined;
  return {
    ...(practice.hint ? { hint: { text: practice.hint.text, ...(practice.hint.audio ? { audioUrl: practice.hint.audio } : {}) } } : {}),
    ...(practice.on_wrong ? { onWrong: practice.on_wrong.map((item) => ({ text: item.text, ...(item.audio ? { audioUrl: item.audio } : {}) })) } : {}),
    ...(practice.reveal_after === undefined ? {} : { revealAfter: practice.reveal_after }),
  };
}

function outcomesFor(scene: SceneYaml, ids: string[], correctId: string | undefined, hotspot: boolean) {
  const authored = scene.practice?.outcomes;
  if (!authored) return undefined;
  if (!correctId || new Set(ids).size !== ids.length || scene.branches.some((branch) => !branch.id && !hotspot)) {
    throw new EngineError('server', `Scene '${scene.id}' practice outcomes require stable, unique answer IDs.`);
  }
  const outcomes: Record<string, { onWrong: { text: string; audioUrl?: string } } | { onCorrect: { image?: { imageUrl: string; alt: string }; line: { text: string; audioUrl?: string } } }> = {};
  for (const [id, outcome] of Object.entries(authored)) {
    if (!ids.includes(id)) throw new EngineError('server', `Scene '${scene.id}' outcome '${id}' is not a selectable answer.`);
    if ('on_wrong' in outcome) {
      if (id === correctId) throw new EngineError('server', `Scene '${scene.id}' gives wrong feedback for its correct answer.`);
      outcomes[id] = { onWrong: { text: outcome.on_wrong.text, ...(outcome.on_wrong.audio ? { audioUrl: outcome.on_wrong.audio } : {}) } };
    } else {
      if (hotspot || id !== correctId) throw new EngineError('server', `Scene '${scene.id}' gives a correct presentation for an invalid choice.`);
      outcomes[id] = { onCorrect: { ...(outcome.on_correct.image ? { image: { imageUrl: outcome.on_correct.image.src, alt: outcome.on_correct.image.alt } } : {}), line: { text: outcome.on_correct.line.text, ...(outcome.on_correct.line.audio ? { audioUrl: outcome.on_correct.line.audio } : {}) } } };
    }
  }
  return outcomes;
}
