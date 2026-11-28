import { z } from 'zod';
import { EngineError, type AnswerSubmission, type Engine, type EngineErrorKind, type EngineRequestOptions, type StartSessionRequest, type Step } from '../types';
import { NodeSchema } from '../../schema/node';

export interface BlazorReference {
  invokeMethodAsync(method: string, ...args: unknown[]): Promise<unknown>;
}

const StepSchema = z.object({
  sessionId: z.string().min(1), version: z.string().min(1),
  ageGroupId: z.enum(['1-2', '3-5', '6-9', '10-12', '13-18', '19+']),
  players: z.array(z.object({ playerId: z.string(), type: z.enum(['Profile', 'Guest']), profileId: z.string().optional(), displayName: z.string(), avatarUrl: z.string().optional() })),
  activePlayerId: z.string().optional(), node: NodeSchema, canGoBack: z.boolean().optional(),
  progress: z.object({ done: z.number().int().nonnegative(), total: z.number().int().nonnegative() }).optional(),
  prefetch: z.array(z.string()).optional(),
});
const ErrorSchema = z.object({ kind: z.enum(['network', 'auth', 'notFound', 'conflict', 'unsupported', 'server']), message: z.string(), currentStep: StepSchema.optional() });
const ReplySchema = z.union([z.object({ step: StepSchema }), z.object({ error: ErrorSchema })]);

/** Calls only the host's authorized .NET object. The host maps private DTOs into presentation-safe Steps. */
export class BlazorInteropEngine implements Engine {
  constructor(private readonly host: BlazorReference) {}

  private async call(method: string, args: unknown[], options?: EngineRequestOptions): Promise<Step> {
    if (options?.signal?.aborted) throw new DOMException('Player request cancelled', 'AbortError');
    let raw: unknown;
    try { raw = await this.host.invokeMethodAsync(method, ...args); }
    catch { throw new EngineError('server', 'The story host could not complete this action.'); }
    if (options?.signal?.aborted) throw new DOMException('Player request cancelled', 'AbortError');
    const reply = ReplySchema.safeParse(raw);
    if (!reply.success) throw new EngineError('unsupported', 'The story host returned an unsupported scene.');
    if ('error' in reply.data) {
      const { kind, message, currentStep } = reply.data.error;
      throw new EngineError(kind as EngineErrorKind, message, currentStep as Step | undefined);
    }
    return reply.data.step as Step;
  }

  startSession(request: StartSessionRequest, options?: EngineRequestOptions): Promise<Step> {
    return this.call('PlayerStartSession', [request], options);
  }
  resumeSession(sessionId: string, options?: EngineRequestOptions): Promise<Step> {
    return this.call('PlayerResumeSession', [sessionId], options);
  }
  respond(sessionId: string, submission: AnswerSubmission, options?: EngineRequestOptions): Promise<Step> {
    return this.call('PlayerRespond', [sessionId, submission], options);
  }
}
