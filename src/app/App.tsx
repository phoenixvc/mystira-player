import { useEffect, useMemo, useState } from 'react';
import { Player } from '../player/Player';
import type { Engine, Profile, StartSessionRequest, Step } from '../engine/types';
import { loadLocalDemo } from './localDemo';
import styles from './App.module.css';

export function App() {
  const search = new URLSearchParams(window.location.search);
  const mummyParty = search.get('story') === 'mummys-party';
  const locale = mummyParty && search.get('lang') === 'af' ? 'af' : 'en';
  const afrikaans = locale === 'af';
  const [demo, setDemo] = useState<{ engine: Engine; activityId: string; isDemoMode?: boolean; fullLesson?: boolean; sceneForProfile?: (sceneId: string, profileId: string) => string | undefined; piecesForProfile?: (profileId: string) => { id: string; title: string; startSceneId: string }[]; assessment?: { engine: Engine; activityId: string; profiles: Profile[]; sequenceProfiles: Profile[]; inspectProfiles: Profile[]; entries: { practice?: string; assessment?: string; followUp?: string; sequence?: string; inspect?: string } } }>();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileId, setProfileId] = useState<string>();
  const [entryPoint, setEntryPoint] = useState('lesson');
  const [notesEnabled, setNotesEnabled] = useState(false);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string>();
  const [sessionKey, setSessionKey] = useState(0);
  const [startNodeId, setStartNodeId] = useState<string>();
  const [currentStep, setCurrentStep] = useState<Step>();
  const [completedPieces, setCompletedPieces] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    loadLocalDemo(mummyParty ? 'mummys-party' : 'pumpkin-gate', locale).then(async (loaded) => {
      const available = await loaded.engine.listProfiles?.() ?? [];
      if (!active) return;
      setDemo(loaded);
      setProfiles(available);
      setProfileId(available[0]?.profileId);
    }).catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Could not load the preview.'); });
    return () => { active = false; };
  }, [mummyParty, locale]);

  const assessmentMode = entryPoint !== 'lesson' && demo?.assessment;
  const activeEngine = assessmentMode ? demo.assessment!.engine : demo?.engine;
  const visibleProfiles = assessmentMode ? entryPoint === 'sequence' ? demo.assessment!.sequenceProfiles : entryPoint === 'inspect' ? demo.assessment!.inspectProfiles : demo.assessment!.profiles : profiles;
  const startRequest: StartSessionRequest | undefined = useMemo(() => demo ? {
    activityId: assessmentMode ? demo.assessment!.activityId : demo.activityId,
    players: profileId ? [{ type: 'Profile', profileId }] : [],
    ...(assessmentMode ? { startNodeId: entryPoint === 'practice' ? demo.assessment!.entries.practice : entryPoint === 'sequence' ? demo.assessment!.entries.sequence : entryPoint === 'inspect' ? demo.assessment!.entries.inspect : entryPoint === 'assessment' ? demo.assessment!.entries.assessment : demo.assessment!.entries.followUp }
      : startNodeId ? { startNodeId } : {}),
  } : undefined, [demo, profileId, entryPoint, startNodeId, assessmentMode]);
  const pieceChoices = entryPoint === 'lesson' && profileId ? demo?.piecesForProfile?.(profileId) ?? [] : [];

  return <main className={styles.shell} lang={locale}>
    {demo?.isDemoMode && <aside className={styles.controls} aria-label="Demo controls">
      {mummyParty && <label>{afrikaans ? 'Taal' : 'Language'} <select aria-label={afrikaans ? 'Taal' : 'Language'} value={locale} onChange={(event) => { const url = new URL(window.location.href); url.searchParams.set('lang', event.target.value); window.location.assign(url.toString()); }}><option value="en">English</option><option value="af">Afrikaans</option></select></label>}
      <label>{afrikaans ? 'Kind' : 'Child'} <select value={profileId ?? ''} onChange={(event) => { const target = event.target.value; const sceneId = currentStep && currentStep.node.type !== 'result' ? currentStep.node.id : startNodeId; const mapped = !assessmentMode && sceneId ? demo.sceneForProfile?.(sceneId, target) : undefined; setStartNodeId(mapped); setProfileId(target); setCompletedPieces([]); setCurrentStep(undefined); if (!assessmentMode && !mapped && demo.piecesForProfile?.(target)?.length) setStarted(false); setSessionKey((key) => key + 1); }}>{visibleProfiles.map((profile) => <option key={profile.profileId} value={profile.profileId}>{profile.displayName}</option>)}</select></label>
      <label>{afrikaans ? 'Beginpunt' : 'Entry point'} <select value={entryPoint} onChange={(event) => { const next = event.target.value; const available = next === 'lesson' ? profiles : next === 'sequence' ? demo.assessment?.sequenceProfiles ?? [] : next === 'inspect' ? demo.assessment?.inspectProfiles ?? [] : demo.assessment?.profiles ?? []; setStartNodeId(undefined); setEntryPoint(next); setProfileId(available.some((profile) => profile.profileId === profileId) ? profileId : available[0]?.profileId); setCompletedPieces([]); setCurrentStep(undefined); setStarted(false); setSessionKey((key) => key + 1); }}><option value="lesson">{afrikaans ? 'Les' : 'Lesson'}</option>{!afrikaans && <><option value="practice" disabled={!demo.assessment?.entries.practice}>Choice practice · Spec 2</option><option value="sequence" disabled={!demo.assessment?.entries.sequence}>Sequence · Spec 3</option><option value="inspect" disabled={!demo.assessment?.entries.inspect}>Inspect · Spec 4</option><option value="assessment" disabled={!demo.assessment?.entries.assessment}>Assessment · Spec 2</option><option value="follow-up" disabled={!demo.assessment?.entries.followUp}>Follow-up assessment · Spec 2</option></>}</select></label>
      {!afrikaans && <label><input type="checkbox" checked={notesEnabled} onChange={(event) => setNotesEnabled(event.target.checked)} /> Grown-up notes</label>}
      {pieceChoices.length > 0 && <fieldset><legend>{afrikaans ? 'Kies ’n lesdeel' : 'Choose a lesson piece'}</legend>{pieceChoices.map((piece) => <span key={piece.id}><button type="button" aria-pressed={startNodeId === piece.startSceneId} onClick={() => { setStartNodeId(piece.startSceneId); setCurrentStep(undefined); setStarted(true); setSessionKey((key) => key + 1); }}>{piece.title}</button>{completedPieces.includes(piece.id) && <small>{afrikaans ? ' Voltooi' : ' Complete'}</small>}</span>)}</fieldset>}
      {pieceChoices.length > 0 && completedPieces.length === pieceChoices.length && <p role="status">{afrikaans ? 'Les voltooi' : 'Lesson complete'}</p>}
    </aside>}
    {!started ? <section className={styles.welcome}>
      <p className={styles.kicker}>Mystira Player</p>
      <h1>{mummyParty ? afrikaans ? 'Die Mummie se Partytjie' : 'The Mummy’s Party' : 'The Pumpkin Gate'}</h1>
      <p>{mummyParty ? afrikaans ? 'Soek brandgevare en maak die partytjie veilig.' : 'Spot fire hazards, make a plan, and get out safely.' : demo?.fullLesson ? 'Learn five ways to check what is true.' : 'A welcoming path through the Manor.'}</p>
      {afrikaans && <p>Hierdie voorskou dek die eerste les. Die openingsvideo se klank is nog Engels; die Afrikaanse onderskrif wys hieronder.</p>}
      <button type="button" disabled={!demo || (pieceChoices.length > 0 && !startNodeId && !mummyParty)} onClick={() => setStarted(true)}>{afrikaans ? 'Begin die les' : demo?.fullLesson ? 'Start lesson' : 'Start preview'}</button>
      {error && <p role="alert">{error}</p>}
    </section> : demo && activeEngine && startRequest && <Player key={sessionKey} engine={activeEngine} startRequest={startRequest} locale={locale} notesEnabled={notesEnabled} isDemoMode={demo.isDemoMode} initialGesture slotGuide={mummyParty} onStep={(step) => { setCurrentStep(step); if (entryPoint === 'lesson' && step.node.id === 'story-end' && startNodeId) { const piece = pieceChoices.find((item) => item.startSceneId === startNodeId); if (piece) setCompletedPieces((done) => done.includes(piece.id) ? done : [...done, piece.id]); } }} />}
  </main>;
}
