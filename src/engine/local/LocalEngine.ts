import type { InteractionType } from '../../schema/interactions';
import type { Node } from '../../schema/node';
import type { StoryYaml } from '../../schema/story-yaml';
import type { Answer, AnswerSubmission, Engine, PlayerSeat, Profile, SessionPlayer, StartSessionRequest, Step } from '../types';
import { EngineError } from '../types';
import { compileScene } from './compiler';
import { createNodeValidator } from '../../schema/node';

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
  checkAttempts: Map<string, 1 | 2>;
  scoredChecks: Set<string>;
  correctFirstTry: number;
  researchAnswer?: string;
  practicePreview?: boolean;
};

export class LocalEngine implements Engine {
  private readonly sessions = new Map<string, Session>();

  constructor(private readonly story: StoryYaml, private readonly enabled: InteractionType[] = []) {}

  async listProfiles(): Promise<Profile[]> {
    return (this.story.demo?.profiles ?? []).map((profile) => ({ profileId: profile.id, displayName: profile.display_name }));
  }

  /** Demo-only mapping; profile-specific piece selection stays inside the engine. */
  demoSceneForProfile(sceneId: string, profileId: string): string | undefined {
    if (!this.story.lesson) return this.getSceneIds(profileId).includes(sceneId) ? sceneId : undefined;
    const piece = this.story.lesson.pieces.find((candidate) => candidate.scenes?.includes(sceneId) || candidate.versions?.some((version) => version.scenes.includes(sceneId)));
    if (!piece) return undefined;
    const profile = this.story.demo?.profiles.find((candidate) => candidate.id === profileId);
    const selected = profile?.versions?.[piece.id];
    return piece.scenes?.[0] ?? (piece.versions?.find((version) => version.id === selected) ?? piece.versions?.[0])?.scenes[0];
  }

  /** Demo-only piece choices; the engine resolves each profile's version. */
  demoPiecesForProfile(profileId: string): { id: string; title: string; startSceneId: string }[] {
    const profile = this.story.demo?.profiles.find((candidate) => candidate.id === profileId);
    if (profile?.order !== 'child_chooses') return [];
    return this.pieceSceneIds(profileId).flatMap((piece) => piece.sceneIds[0]
      ? [{ id: piece.id, title: piece.title, startSceneId: piece.sceneIds[0] }]
      : []);
  }

  /** Demo entry tokens keep check scene IDs and answer data inside the engine. */
  demoAssessmentEntries(): { assessment?: string; followUp?: string } {
    return this.story.lesson?.checks?.length && this.enabled.includes('choices') && this.enabled.includes('hotspots')
      ? { assessment: 'assessment', followUp: 'follow-up' } : {};
  }

  /** Demo-only start for the first supported choice practice piece. */
  demoPracticeEntry(): string | undefined {
    if (!this.enabled.includes('choices')) return undefined;
    const firstPiece = this.story.lesson?.pieces[0];
    return firstPiece?.scenes?.find((id) => this.story.scenes.some((scene) => scene.id === id && scene.practice?.answer.branch && scene.branches.length >= 2));
  }

  async startSession(request: StartSessionRequest): Promise<Step> {
    const expectedActivityId = this.story.lesson?.id ?? this.story.title;
    if (request.activityId !== expectedActivityId) throw new EngineError('notFound', `Activity '${request.activityId}' was not found.`);
    const profileId = request.players.find((player): player is Extract<PlayerSeat, { type: 'Profile' }> => player.type === 'Profile')?.profileId
      ?? this.story.demo?.profiles[0]?.id;
    if (!profileId) throw new EngineError('notFound', 'This local story has no demo profile.');
    const profile = this.story.demo?.profiles.find((candidate) => candidate.id === profileId);
    if (this.story.demo && !profile) throw new EngineError('notFound', `Demo profile '${profileId}' was not found.`);
    if (profile?.order === 'child_chooses' && this.story.lesson && !request.startNodeId) {
      throw new EngineError('unsupported', 'Choose a lesson piece before starting this profile.');
    }
    const assessmentEntry = request.startNodeId === 'assessment' || request.startNodeId === 'follow-up';
    if (assessmentEntry && !this.demoAssessmentEntries().assessment) throw new EngineError('unsupported', 'Assessment interactions are not enabled.');
    const firstCheck = this.checkQuestions()[0]?.scene;
    const availableSceneIds = this.getSceneIds(profileId, assessmentEntry ? undefined : request.startNodeId);
    const assessmentIndex = availableSceneIds.indexOf(firstCheck ?? '');
    if (assessmentEntry && assessmentIndex < 0) throw new EngineError('notFound', 'The assessment start scene is unavailable.');
    const practicePreview = !assessmentEntry && profile?.order === 'fixed' && !!request.startNodeId && request.startNodeId === this.demoPracticeEntry();
    const firstUnsupported = practicePreview ? availableSceneIds.findIndex((id) => {
      const kind = this.story.scenes.find((scene) => scene.id === id)?.interaction?.kind;
      return kind !== undefined && !this.enabled.includes(kind);
    }) : -1;
    const sceneIds = assessmentEntry ? availableSceneIds.slice(assessmentIndex) : practicePreview
      ? availableSceneIds.slice(0, firstUnsupported < 0 ? availableSceneIds.length : firstUnsupported) : availableSceneIds;
    if (sceneIds.length === 0) {
      if (request.startNodeId) throw new EngineError('notFound', `Start scene '${request.startNodeId}' is not available for this profile.`);
      throw new EngineError('unsupported', 'This story has no playable lesson scenes yet.');
    }
    const startIndex = assessmentEntry ? 0 : request.startNodeId === undefined ? 0 : sceneIds.indexOf(request.startNodeId);
    if (startIndex < 0) throw new EngineError('notFound', `Start scene '${request.startNodeId}' is not available for this profile.`);
    const players = request.players.length > 0 ? request.players : [{ type: 'Guest' as const, displayName: profile?.display_name ?? 'Guest' }];
    const session: Session = {
      id: crypto.randomUUID(), sceneIds, index: startIndex, history: [], version: 1, practicePreview,
      profileId,
      ageGroupId: this.story.age_group,
      players: players.map((seat) => this.toSessionPlayer(seat)),
      responses: new Map(),
      checkAttempts: new Map(request.startNodeId === 'follow-up' ? this.checkQuestions().map((question) => [question.scene, 2] as const) : []),
      scoredChecks: new Set(), correctFirstTry: 0,
    };
    const first = this.toStep(session);
    this.sessions.set(session.id, session);
    return first;
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

    let nextIndex: number;
    let nextHistory: number[];
    const checkAttempts = new Map(session.checkAttempts);
    const scoredChecks = new Set(session.scoredChecks);
    let correctFirstTry = session.correctFirstTry;
    let researchAnswer = session.researchAnswer;
    if (submission.answer.kind === 'back') {
      if (!current.canGoBack) throw new EngineError('conflict', 'Back navigation is not allowed from this scene.', current);
      nextIndex = session.history[session.history.length - 1]!;
      nextHistory = session.history.slice(0, -1);
    } else {
      if (!this.answerMatches(current.node, submission.answer)) throw new EngineError('unsupported', `Answer '${submission.answer.kind}' does not match this scene.`);
      if (!this.practiceAnswerIsCorrect(current.node, submission.answer)) {
        session.responses.set(submission.answerRequestId, current);
        return current;
      }
      const check = this.checkQuestions().find((question) => question.scene === current.node.id);
      if (current.node.type === 'check' && check) {
        const correct = this.checkAnswerMatches(check.answer, submission.answer);
        if (current.node.attempt === 1 && !scoredChecks.has(check.scene)) {
          scoredChecks.add(check.scene);
          if (correct) correctFirstTry += 1;
        }
        if (current.node.attempt === 1 && !correct) {
          checkAttempts.set(check.scene, 2);
          researchAnswer = this.answerLabel(current.node, submission.answer);
          nextIndex = check.research?.length ? session.sceneIds.indexOf(check.research[0]!) : session.index;
        } else nextIndex = this.indexAfterCheck(session.sceneIds, check.scene);
      } else if (current.node.type === 'research' && this.lastResearchScene(current.node.id)) {
        const owner = this.checkQuestions().find((question) => question.research?.includes(current.node.id));
        nextIndex = owner ? session.sceneIds.indexOf(owner.scene) : this.nextSceneIndex(session, submission.answer);
      } else nextIndex = this.nextSceneIndex(session, submission.answer);
      nextHistory = [...session.history, session.index];
    }
    const prospective = { ...session, index: nextIndex, history: nextHistory, version: session.version + 1, checkAttempts, scoredChecks, correctFirstTry, researchAnswer };
    const next = this.toStep(prospective);
    session.index = nextIndex;
    session.history = nextHistory;
    session.version = prospective.version;
    session.checkAttempts = checkAttempts;
    session.scoredChecks = scoredChecks;
    session.correctFirstTry = correctFirstTry;
    session.researchAnswer = researchAnswer;
    session.responses.set(submission.answerRequestId, next);
    return next;
  }

  private pieceSceneIds(profileId: string): { id: string; title: string; sceneIds: string[] }[] {
    const lesson = this.story.lesson;
    if (!lesson) return [];
    const profile = this.story.demo?.profiles.find((candidate) => candidate.id === profileId);
    return lesson.pieces.map((piece) => {
      if (piece.scenes) return { id: piece.id, title: piece.title, sceneIds: piece.scenes };
      const chosenVersion = profile?.versions?.[piece.id];
      const version = piece.versions?.find((entry) => entry.id === chosenVersion) ?? piece.versions?.[0];
      return { id: piece.id, title: piece.title, sceneIds: version?.scenes ?? [] };
    });
  }

  private getSceneIds(profileId: string, startNodeId?: string): string[] {
    if (!this.story.lesson) return this.story.scenes.map((scene) => scene.id);
    const pieces = this.pieceSceneIds(profileId);
    const profile = this.story.demo?.profiles.find((candidate) => candidate.id === profileId);
    if (profile?.order === 'child_chooses' && startNodeId) {
      return pieces.find((piece) => piece.sceneIds.includes(startNodeId ?? ''))?.sceneIds ?? [];
    }
    const lessonIds = profile?.order === 'child_chooses' ? [] : pieces.flatMap((piece) => piece.sceneIds);
    const assessmentIds = this.checkQuestions().flatMap((question) => [question.scene, ...(question.research ?? [])]);
    return [...lessonIds, ...assessmentIds, ...(this.story.lesson.result ? [this.story.lesson.result.scene] : [])];
  }

  private checkQuestions() {
    return this.story.lesson?.checks?.flatMap((check) => check.questions) ?? [];
  }

  private indexAfterCheck(sceneIds: string[], checkSceneId: string): number {
    const questions = this.checkQuestions();
    const index = questions.findIndex((question) => question.scene === checkSceneId);
    return sceneIds.indexOf(questions[index + 1]?.scene ?? this.story.lesson?.result?.scene ?? '') >= 0
      ? sceneIds.indexOf(questions[index + 1]?.scene ?? this.story.lesson?.result?.scene ?? '') : sceneIds.length;
  }

  private lastResearchScene(sceneId: string): boolean {
    return this.checkQuestions().some((question) => question.research?.at(-1) === sceneId);
  }

  private checkAnswerMatches(expected: { branch?: string; object?: string; order?: string[]; parts?: string[] }, actual: Answer): boolean {
    if (actual.kind === 'choice') return actual.choiceId === expected.branch;
    if (actual.kind === 'hotspot') return actual.hotspotId === expected.object;
    if (actual.kind === 'sequence') return JSON.stringify(actual.itemIds) === JSON.stringify(expected.order);
    if (actual.kind === 'inspect') return JSON.stringify([...actual.partIds].sort()) === JSON.stringify([...(expected.parts ?? [])].sort());
    return false;
  }

  private answerLabel(node: Node, answer: Answer): string | undefined {
    if (node.interaction.type === 'choices' && answer.kind === 'choice') return node.interaction.options.find((option) => option.id === answer.choiceId)?.label;
    if (node.interaction.type === 'hotspots' && answer.kind === 'hotspot') return node.interaction.spots.find((spot) => spot.id === answer.hotspotId)?.label;
    return undefined;
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
        const profile = this.story.demo?.profiles.find((candidate) => candidate.id === session.profileId);
        const mapped = this.demoSceneForProfile(target, session.profileId);
        const mappedIndex = mapped ? session.sceneIds.indexOf(mapped) : -1;
        const pieceFor = (id: string) => this.story.lesson?.pieces.find((piece) => piece.scenes?.includes(id) || piece.versions?.some((version) => version.scenes.includes(id)))?.id;
        const crossesPiece = pieceFor(target) !== undefined && pieceFor(target) !== pieceFor(scene.id);
        if (crossesPiece && mappedIndex >= 0) return mappedIndex;
        if (profile?.order === 'child_chooses' && crossesPiece && mapped) {
          return session.sceneIds.length;
        }
        if (session.practicePreview && crossesPiece) return session.sceneIds.length;
        throw new EngineError('unsupported', `Scene '${scene.id}' points to unavailable scene '${target}'.`);
      }
      return targetIndex;
    }
    if (this.lastResearchScene(scene.id)) {
      const owner = this.checkQuestions().find((question) => question.research?.includes(scene.id));
      if (owner) return session.sceneIds.indexOf(owner.scene);
    }
    if (this.checkQuestions().some((question) => question.scene === scene.id)) return this.indexAfterCheck(session.sceneIds, scene.id);
    if (answer.kind !== 'continue' && answer.kind !== 'choice' && answer.kind !== 'hotspot') {
      throw new EngineError('unsupported', `Navigation for '${answer.kind}' is not implemented yet.`);
    }
    if (session.index + 1 < session.sceneIds.length && this.story.lesson) return session.index + 1;
    const profile = this.story.demo?.profiles.find((candidate) => candidate.id === session.profileId);
    if (this.story.lesson?.checks?.length && profile?.order !== 'child_chooses' && session.index + 1 >= session.sceneIds.length) return session.sceneIds.length;
    return session.sceneIds.length;
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
    if (session.index === session.sceneIds.length) {
      const profile = this.story.demo?.profiles.find((candidate) => candidate.id === session.profileId);
      const end: Node = {
        type: 'result', id: 'story-end', title: profile?.order === 'child_chooses' ? 'Piece complete' : 'The End', media: {}, characters: [], speakers: [], lines: [], overlays: [],
        correctFirstTry: 0, total: 0, interaction: { type: 'continue' },
      };
      return { sessionId: session.id, version: String(session.version), ageGroupId: session.ageGroupId,
        players: session.players, node: end, canGoBack: session.history.length > 0,
        progress: { done: session.sceneIds.length, total: session.sceneIds.length } };
    }
    const sceneId = session.sceneIds[session.index];
    const scene = this.story.scenes.find((candidate) => candidate.id === sceneId);
    if (!scene) throw new EngineError('notFound', `Scene '${sceneId ?? ''}' was not found in the story.`);
    const base = compileScene(scene, this.story, this.enabled, session.profileId);
    const question = this.checkQuestions().find((item) => item.scene === scene.id);
    let node: Node = base;
    if (question) {
      const attempt = session.checkAttempts.get(scene.id) ?? 1;
      node = createNodeValidator(this.enabled).parse({ ...base, type: 'check', question: { text: scene.description }, attempt, scored: attempt === 1, task: undefined });
    } else if (scene.research) {
      node = createNodeValidator(this.enabled).parse({ ...base, type: 'research', step: scene.research.step, ...(scene.research.source ? { source: scene.research.source } : {}), ...(session.researchAnswer ? { yourAnswer: session.researchAnswer } : {}) });
    } else if (this.story.lesson?.result?.scene === scene.id) {
      const key = this.story.lesson.result.key;
      node = createNodeValidator(this.enabled).parse({ ...base, type: 'result', correctFirstTry: session.correctFirstTry, total: this.checkQuestions().length, ...(key?.image ? { key: { label: key.label, iconUrl: key.image } } : {}) });
    }
    return {
      sessionId: session.id, version: String(session.version), ageGroupId: session.ageGroupId,
      players: session.players, node, canGoBack: node.type !== 'check' && node.type !== 'research' && !(node.type === 'result' && this.checkQuestions().length > 0) && session.history.length > 0,
      progress: { done: node.type === 'result' ? session.sceneIds.length : session.index, total: session.sceneIds.length },
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
