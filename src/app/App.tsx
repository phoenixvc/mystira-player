import { useEffect, useState } from 'react';
import { EngineError, type Answer, type Engine, type Step } from '../engine/types';
import { loadLocalDemo } from './localDemo';

export function App() {
  const [demo, setDemo] = useState<{ engine: Engine; activityId: string }>();
  const [step, setStep] = useState<Step>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    loadLocalDemo().then((loaded) => { if (active) setDemo(loaded); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Could not load the preview.'); });
    return () => { active = false; };
  }, []);

  async function start() {
    if (!demo || busy) return;
    setBusy(true);
    setError(undefined);
    try {
      setStep(await demo.engine.startSession({ activityId: demo.activityId, players: [] }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not start the preview.');
    } finally {
      setBusy(false);
    }
  }

  async function navigate(answer: Answer) {
    if (!demo || !step || busy) return;
    setBusy(true);
    setError(undefined);
    try {
      const next = await demo.engine.respond(step.sessionId, {
        answerRequestId: crypto.randomUUID(), version: step.version, nodeId: step.node.id, answer,
        playerId: step.players[0]?.playerId,
      });
      setStep(next);
    } catch (cause) {
      if (cause instanceof EngineError && cause.kind === 'conflict' && cause.currentStep) setStep(cause.currentStep);
      setError(cause instanceof Error ? cause.message : 'Could not change scenes.');
    } finally {
      setBusy(false);
    }
  }

  const atEnd = step?.progress && step.progress.done + 1 >= step.progress.total;
  const canContinue = step?.node.interaction.type === 'continue';
  return (
    <main className="player-shell">
      <p className="player-kicker">Mystira Player</p>
      {!step ? (
        <>
          <h1>The Pumpkin Gate</h1>
          <p className="player-copy">A short preview of the shared scene and navigation path.</p>
          <button type="button" disabled={!demo || busy} onClick={() => void start()}>Start preview</button>
        </>
      ) : (
        <section aria-label="Story scene">
          <h1>{step.node.title ?? 'Story scene'}</h1>
          {step.node.lines.map((line, index) => <p className="player-copy" key={`${step.node.id}-${index}`}>{line.text}</p>)}
          <div className="player-actions">
            {step.canGoBack && <button type="button" disabled={busy} onClick={() => void navigate({ kind: 'back' })}>Back</button>}
            {canContinue && (atEnd ? <button type="button" disabled={busy} onClick={() => void start()}>Play again</button>
              : <button type="button" disabled={busy} onClick={() => void navigate({ kind: 'continue' })}>Next</button>)}
          </div>
          {!canContinue && <p role="status">This interaction is not available in the core preview yet.</p>}
          <p className="player-copy">Scene {step.progress ? step.progress.done + 1 : 1} of {step.progress?.total ?? 1}</p>
        </section>
      )}
      {error && <p role="alert">{error}</p>}
      <p className="player-copy">The full Manor interactions are planned in the next specs.</p>
    </main>
  );
}
