import { useEffect, useMemo, useState } from 'react';
import { Player } from '../player/Player';
import type { Engine, Profile, StartSessionRequest } from '../engine/types';
import { loadLocalDemo } from './localDemo';
import styles from './App.module.css';

export function App() {
  const [demo, setDemo] = useState<{ engine: Engine; activityId: string; isDemoMode?: boolean }>();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profileId, setProfileId] = useState<string>();
  const [entryPoint, setEntryPoint] = useState('lesson');
  const [notesEnabled, setNotesEnabled] = useState(false);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string>();
  const [sessionKey, setSessionKey] = useState(0);

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
    ...(entryPoint === 'lesson' ? {} : { startNodeId: entryPoint }),
  } : undefined, [demo, profileId, entryPoint]);

  return <main className={styles.shell}>
    {demo?.isDemoMode && <aside className={styles.controls} aria-label="Demo controls">
      <label>Child <select value={profileId ?? ''} onChange={(event) => { setProfileId(event.target.value); setSessionKey((key) => key + 1); }}>{profiles.map((profile) => <option key={profile.profileId} value={profile.profileId}>{profile.displayName}</option>)}</select></label>
      <label>Entry point <select value={entryPoint} onChange={(event) => { setEntryPoint(event.target.value); setSessionKey((key) => key + 1); }}><option value="lesson">Lesson</option><option value="assessment">Assessment</option><option value="follow-up">Follow-up assessment</option></select></label>
      <label><input type="checkbox" checked={notesEnabled} onChange={(event) => setNotesEnabled(event.target.checked)} /> Grown-up notes</label>
    </aside>}
    {!started ? <section className={styles.welcome}>
      <p className={styles.kicker}>Mystira Player</p>
      <h1>The Pumpkin Gate</h1>
      <p>A welcoming path through the Manor.</p>
      <button type="button" disabled={!demo} onClick={() => setStarted(true)}>Start preview</button>
      {error && <p role="alert">{error}</p>}
    </section> : demo && startRequest && <Player key={sessionKey} engine={demo.engine} startRequest={startRequest} notesEnabled={notesEnabled} isDemoMode={demo.isDemoMode} />}
  </main>;
}
