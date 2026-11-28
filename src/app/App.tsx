import { useEffect, useMemo, useState } from 'react';
import { Player } from '../player/Player';
import type { Engine, Profile, StartSessionRequest, Step } from '../engine/types';
import { loadLocalDemo } from './localDemo';
import styles from './App.module.css';

export function App() {
  const [demo, setDemo] = useState<{ engine: Engine; activityId: string; isDemoMode?: boolean; sceneForProfile?: (sceneId: string, profileId: string) => string | undefined; piecesForProfile?: (profileId: string) => { id: string; title: string; startSceneId: string }[] }>();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileId, setProfileId] = useState<string>();
  const [entryPoint, setEntryPoint] = useState('lesson');
  const [notesEnabled, setNotesEnabled] = useState(false);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string>();
  const [sessionKey, setSessionKey] = useState(0);
  const [startNodeId, setStartNodeId] = useState<string>();
  const [currentStep, setCurrentStep] = useState<Step>();

  useEffect(() => {
    let active = true;
    loadLocalDemo().then(async (loaded) => {
      const available = await loaded.engine.listProfiles?.() ?? [];
      if (!active) return;
      setDemo(loaded);
      setProfiles(available);
      setProfileId(available[0]?.profileId);
    }).catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Could not load the preview.'); });
    return () => { active = false; };
  }, []);

  const startRequest: StartSessionRequest | undefined = useMemo(() => demo ? {
    activityId: demo.activityId,
    players: profileId ? [{ type: 'Profile', profileId }] : [],
    ...(startNodeId ? { startNodeId } : entryPoint === 'lesson' ? {} : { startNodeId: entryPoint }),
  } : undefined, [demo, profileId, entryPoint, startNodeId]);
  const pieceChoices = profileId ? demo?.piecesForProfile?.(profileId) ?? [] : [];

  return <main className={styles.shell}>
    {demo?.isDemoMode && <aside className={styles.controls} aria-label="Demo controls">
      <label>Child <select value={profileId ?? ''} onChange={(event) => { const target = event.target.value; const mapped = currentStep && currentStep.node.type !== 'result' ? demo.sceneForProfile?.(currentStep.node.id, target) : undefined; setStartNodeId(mapped); setProfileId(target); setCurrentStep(undefined); if (!mapped && demo.piecesForProfile?.(target)?.length) setStarted(false); setSessionKey((key) => key + 1); }}>{profiles.map((profile) => <option key={profile.profileId} value={profile.profileId}>{profile.displayName}</option>)}</select></label>
      <label>Entry point <select value={entryPoint} onChange={(event) => { setStartNodeId(undefined); setEntryPoint(event.target.value); setCurrentStep(undefined); if (pieceChoices.length) setStarted(false); setSessionKey((key) => key + 1); }}><option value="lesson">Lesson</option><option value="assessment" disabled>Assessment · Spec 2</option><option value="follow-up" disabled>Follow-up assessment · Spec 2</option></select></label>
      <label><input type="checkbox" checked={notesEnabled} onChange={(event) => setNotesEnabled(event.target.checked)} /> Grown-up notes</label>
      {pieceChoices.length > 0 && <fieldset><legend>Choose a lesson piece</legend>{pieceChoices.map((piece) => <button key={piece.id} type="button" aria-pressed={startNodeId === piece.startSceneId} onClick={() => { setStartNodeId(piece.startSceneId); setCurrentStep(undefined); setStarted(true); setSessionKey((key) => key + 1); }}>{piece.title}</button>)}</fieldset>}
    </aside>}
    {!started ? <section className={styles.welcome}>
      <p className={styles.kicker}>Mystira Player</p>
      <h1>The Pumpkin Gate</h1>
      <p>A welcoming path through the Manor.</p>
      <button type="button" disabled={!demo || (pieceChoices.length > 0 && !startNodeId)} onClick={() => setStarted(true)}>Start preview</button>
      {error && <p role="alert">{error}</p>}
    </section> : demo && startRequest && <Player key={sessionKey} engine={demo.engine} startRequest={startRequest} notesEnabled={notesEnabled} isDemoMode={demo.isDemoMode} initialGesture onStep={setCurrentStep} />}
  </main>;
}
