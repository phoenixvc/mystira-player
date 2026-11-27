import type { InteractionType } from '../../schema/interactions';
import type { Node } from '../../schema/node';
import type { StoryYaml } from '../../schema/story-yaml';
import type { Answer, AnswerSubmission, Engine, PlayerSeat, Profile, SessionPlayer, StartSessionRequest, Step } from '../types';
import { EngineError } from '../types';
import { compileScene } from './compiler';

type Session = {
  id: string;
  sceneIds: string[];
  index: number;
  history: number[];
  version: number;
  ageGroupId: Step['ageGroupId'];
  profileId: string;
  players: SessionPlayer[];
  responses: Map<string, Step>;
};

export class LocalEngine implements Engine {
  private readonly sessions = new Map<string, Session>();

  constructor(private readonly story: StoryYaml, private readonly enabled: InteractionType[] = []) {}

  async listProfiles(): Promise<Profile[]> {
    return (this.story.demo?.profiles ?? []).map((profile) => ({ profileId: profile.id, displayName: profile.display_name }));
  }

  async startSession(request: StartSessionRequest): Promise<Step> {
    const expectedActivityId = this.story.lesson?.id ?? this.story.title;
    if (request.activityId !== expectedActivityId) throw new EngineError('notFound', `Activity '${request.activityId}' was not found.`);
    const profileId = request.players.find((player): player is Extract<PlayerSeat, { type: 'Profile' }> => player.type === 'Profile')?.profileId
      ?? this.story.demo?.profiles[0]?.id;
    if (!profileId) throw new EngineError('notFound', 'This local story has no demo profile.');
    const profile = this.story.demo?.profiles.find((candidate) => candidate.id === profileId);
    if (this.story.demo && !profile) throw new EngineError('notFound', `Demo profile '${profileId}' was not found.`);
    const sceneIds = this.getSceneIds(profileId);
    if (sceneIds.length === 0) throw new EngineError('unsupported', 'This story has no playable lesson scenes yet.');
    const players = request.players.length > 0 ? request.players : [{ type: 'Guest' as const, displayName: profile?.display_name ?? 'Guest' }];
    const session: Session = {
      id: crypto.randomUUID(), sceneIds, index: 0, history: [], version: 1,
      profileId,
      ageGroupId: this.story.age_group,
      players: players.map((seat) => this.toSessionPlayer(seat)),
      responses: new Map(),
    };
    this.sessions.set(session.id, session);
    return this.toStep(session);
  }

  async resumeSession(sessionId: string): Promise<Step> {
    const session = this.getSession(sessionId);
    return this.toStep(session);
  }

  async respond(sessionId: string, submission: AnswerSubmission): Promise<Step> {
    const session = this.getSession(sessionId);
    const replay = session.responses.get(submission.answerRequestId);
    if (replay) return replay;
    const current = this.toStep(session);
    if (submission.version !== current.version) throw new EngineError('conflict', 'The answer was given for an older scene.', current);
    if (submission.nodeId !== current.node.id) throw new EngineError('conflict', 'The answer refers to a different scene.', current);

    if (submission.answer.kind === 'back') {
      if (!current.canGoBack) throw new EngineError('conflict', 'Back navigation is not allowed from this scene.', current);
      session.index = session.history.pop()!;
    } else {
      if (!this.answerMatches(current.node, submission.answer)) throw new EngineError('unsupported', `Answer '${submission.answer.kind}' does not match this scene.`);
      if (!this.practiceAnswerIsCorrect(current.node, submission.answer)) {
        session.responses.set(submission.answerRequestId, current);
        return current;
      }
      const nextIndex = this.nextSceneIndex(session, submission.answer);
      session.history.push(session.index);
      session.index = nextIndex;
    }
    session.version += 1;
    const next = this.toStep(session);
    session.responses.set(submission.answerRequestId, next);
    return next;
  }

  private getSceneIds(profileId: string): string[] {
    const lesson = this.story.lesson;
    if (!lesson) return this.story.scenes.map((scene) => scene.id);
    const profile = this.story.demo?.profiles.find((candidate) => candidate.id === profileId);
    const ids = lesson.pieces.flatMap((piece) => {
      if (piece.scenes) return piece.scenes;
      const chosenVersion = profile?.versions?.[piece.id];
      const version = piece.versions?.find((entry) => entry.id === chosenVersion) ?? piece.versions?.[0];
      return version?.scenes ?? [];
    });
    return ids;
  }

  private nextSceneIndex(session: Session, answer: Answer): number {
    const sceneId = session.sceneIds[session.index];
    const scene = this.story.scenes.find((candidate) => candidate.id === sceneId);
    if (!scene) throw new EngineError('notFound', `Scene '${sceneId ?? ''}' was not found in the story.`);
    let target: string | null | undefined;
    if (answer.kind === 'choice') {
      target = scene.branches.find((branch, index) => (branch.id ?? `choice-${index + 1}`) === answer.choiceId)?.next_scene;
    } else if (answer.kind === 'hotspot') {
      target = scene.branches.find((branch) => branch.object_id === answer.hotspotId)?.next_scene;
    } else if (answer.kind === 'continue') {
      target = scene.next_scene;
    }
    if (target) {
      const targetIndex = session.sceneIds.indexOf(target);
      if (targetIndex < 0) {
        throw new EngineError('unsupported', `Scene '${scene.id}' points to unavailable scene '${target}'.`);
      }
      return targetIndex;
    }
    if (answer.kind !== 'continue' && answer.kind !== 'choice' && answer.kind !== 'hotspot') {
      throw new EngineError('unsupported', `Navigation for '${answer.kind}' is not implemented yet.`);
    }
    if (session.index + 1 < session.sceneIds.length && this.story.lesson) return session.index + 1;
    if (this.story.lesson?.checks?.length && session.index + 1 >= session.sceneIds.length) {
      throw new EngineError('unsupported', 'The lesson check requires the choices/hotspots spec; it cannot be skipped.');
    }
    throw new EngineError('unsupported', 'This session has reached its end; the end view is not implemented yet.');
  }

  private toSessionPlayer(seat: PlayerSeat): SessionPlayer {
    return seat.type === 'Profile'
      ? { playerId: crypto.randomUUID(), type: 'Profile', profileId: seat.profileId, displayName: this.story.demo?.profiles.find((profile) => profile.id === seat.profileId)?.display_name ?? seat.profileId }
      : { playerId: crypto.randomUUID(), type: 'Guest', displayName: seat.displayName };
  }

  private getSession(sessionId: string): Session {
    const session = this.sessions.get(sessionId);
    if (!session) throw new EngineError('notFound', `Session '${sessionId}' was not found.`);
    return session;
  }

  private toStep(session: Session): Step {
    const sceneId = session.sceneIds[session.index];
    const scene = this.story.scenes.find((candidate) => candidate.id === sceneId);
    if (!scene) throw new EngineError('notFound', `Scene '${sceneId ?? ''}' was not found in the story.`);
    const node: Node = compileScene(scene, this.story, this.enabled, session.profileId);
    return {
      sessionId: session.id, version: String(session.version), ageGroupId: session.ageGroupId,
      players: session.players, node, canGoBack: session.history.length > 0,
      progress: { done: session.index, total: session.sceneIds.length },
    };
  }

  private answerMatches(node: Node, answer: Answer): boolean {
    const interaction = node.interaction;
    switch (interaction.type) {
      case 'continue': return answer.kind === 'continue';
      case 'choices': return answer.kind === 'choice' && interaction.options.some((option) => option.id === answer.choiceId);
      case 'hotspots': return answer.kind === 'hotspot' && interaction.spots.some((spot) => spot.id === answer.hotspotId);
      case 'sequence': return answer.kind === 'sequence' && answer.itemIds.length === interaction.items.length;
      case 'inspect': return answer.kind === 'inspect' && answer.partIds.every((id) => interaction.document.parts.some((part) => part.id === id));
      case 'pattern': return answer.kind === 'pattern';
      case 'keypad': return answer.kind === 'keypad';
      case 'count': return answer.kind === 'count';
    }
  }

  private practiceAnswerIsCorrect(node: Node, answer: Answer): boolean {
    const local = node.interaction.type === 'choices' || node.interaction.type === 'hotspots' || node.interaction.type === 'sequence' || node.interaction.type === 'inspect'
      ? node.interaction.local
      : undefined;
    if (!local) return true;
    if (node.interaction.type === 'choices' && answer.kind === 'choice' && 'correctId' in local) return answer.choiceId === local.correctId;
    if (node.interaction.type === 'hotspots' && answer.kind === 'hotspot' && 'correctId' in local) return answer.hotspotId === local.correctId;
    if (node.interaction.type === 'sequence' && answer.kind === 'sequence' && 'order' in local) return answer.itemIds.length === local.order.length && answer.itemIds.every((id, index) => id === local.order[index]);
    if (node.interaction.type === 'inspect' && answer.kind === 'inspect' && 'flagged' in local) return local.flagged.every((id) => answer.partIds.includes(id));
    return true;
  }
}
