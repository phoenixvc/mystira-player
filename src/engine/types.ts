import type { Node, Region } from '../schema/node';
export type AgeGroupId = '1-2' | '3-5' | '6-9' | '10-12' | '13-18' | '19+';
export type Profile = { profileId: string; displayName: string; avatarUrl?: string };
export type PlayerSeat = { type: 'Profile'; profileId: string } | { type: 'Guest'; displayName: string };
export type SessionPlayer = { playerId: string; type: 'Profile' | 'Guest'; profileId?: string; displayName: string; avatarUrl?: string };
export type ActivityCard = { activityId: string; kind: 'story' | 'lesson' | 'check'; title: string; imageUrl: string; ageGroupId: AgeGroupId; state: 'locked' | 'open' | 'solved'; pending: boolean; resumeSessionId?: string };
export type Hub = { background: { imageUrl: string; alt: string }; doors: { activityId: string; region: Region; label: string }[]; keys?: { activityId: string; label: string; iconUrl: string }[] };
export type Home = { activities: ActivityCard[]; hub?: Hub };
export type StartSessionRequest = { activityId: string; players: PlayerSeat[]; startNodeId?: string };
export type Answer = { kind: 'continue' } | { kind: 'back' } | { kind: 'choice'; choiceId: string } | { kind: 'hotspot'; hotspotId: string } | { kind: 'sequence'; itemIds: string[] } | { kind: 'inspect'; partIds: string[] } | { kind: 'roll' } | { kind: 'pattern'; stepIds: string[] } | { kind: 'keypad'; value: string } | { kind: 'count'; targetIds: string[] };
export type AnswerSubmission = { answerRequestId: string; version: string; nodeId: string; answer: Answer; wrongTries?: number; playerId?: string };
export type EngineRequestOptions = { signal?: AbortSignal };
export type Step = { sessionId: string; version: string; ageGroupId: AgeGroupId; players: SessionPlayer[]; activePlayerId?: string; node: Node; canGoBack?: boolean; progress?: { done: number; total: number }; prefetch?: string[] };
export type EngineErrorKind = 'network' | 'auth' | 'notFound' | 'conflict' | 'unsupported' | 'server';
export class EngineError extends Error {
  constructor(public readonly kind: EngineErrorKind, message: string, public readonly currentStep?: Step) { super(message); this.name = 'EngineError'; }
}
export interface Engine {
  listProfiles?(): Promise<Profile[]>;
  getHome?(profileId: string): Promise<Home>;
  startSession(request: StartSessionRequest, options?: EngineRequestOptions): Promise<Step>;
  resumeSession(sessionId: string, options?: EngineRequestOptions): Promise<Step>;
  respond(sessionId: string, submission: AnswerSubmission, options?: EngineRequestOptions): Promise<Step>;
}
