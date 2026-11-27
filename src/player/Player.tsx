import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { EngineError, type Answer, type Engine, type StartSessionRequest, type Step } from '../engine/types';
import styles from './Player.module.css';
import { manorTheme, themeStyle, type PlayerTheme } from '../theme/tokens';

type Props = {
  engine: Engine;
  startRequest: StartSessionRequest;
  notesEnabled?: boolean;
  isDemoMode?: boolean;
  onStep?: (step: Step) => void;
  theme?: PlayerTheme;
};

const slots = ['left', 'center', 'right'] as const;

export function Player({ engine, startRequest, notesEnabled = false, isDemoMode = false, onStep, theme = manorTheme }: Props) {
  const [step, setStep] = useState<Step>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [narration, setNarration] = useState<boolean>();
  const [lineIndex, setLineIndex] = useState(0);
  const [reaction, setReaction] = useState<string>();
  const audio = useRef<HTMLAudioElement | undefined>(undefined);
  const video = useRef<HTMLVideoElement>(null);
  const request = useRef<{ key: string; id: string; answer: Answer } | undefined>(undefined);
  const generation = useRef(0);
  const busyRef = useRef(false);
  const autoAdvanced = useRef<string | undefined>(undefined);

  const stopMedia = useCallback(() => {
    generation.current += 1;
    audio.current?.pause();
    audio.current = undefined;
    video.current?.pause();
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  }, []);

  useEffect(() => {
    let active = true;
    stopMedia();
    setStep(undefined);
    setError(undefined);
    setBusy(true);
    busyRef.current = true;
    request.current = undefined;
    engine.startSession(startRequest).then((next) => {
      if (active) { setStep(next); onStep?.(next); }
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'Could not start the story.');
    }).finally(() => { if (active) { setBusy(false); busyRef.current = false; } });
    return () => { active = false; stopMedia(); };
  }, [engine, startRequest, stopMedia, onStep]);

  useEffect(() => {
    stopMedia();
    setLineIndex(0);
    setReaction(undefined);
    autoAdvanced.current = undefined;
  }, [step?.node.id, step?.version, stopMedia]);

  const answer = useCallback(async (value: Answer) => {
    if (!step || busyRef.current) return;
    stopMedia();
    busyRef.current = true;
    setBusy(true);
    setError(undefined);
    const key = `${step.sessionId}:${step.node.id}:${step.version}`;
    if (request.current?.key !== key || JSON.stringify(request.current.answer) !== JSON.stringify(value)) {
      request.current = { key, id: crypto.randomUUID(), answer: value };
    }
    try {
      const next = await engine.respond(step.sessionId, {
        answerRequestId: request.current.id, version: step.version, nodeId: step.node.id,
        answer: value, playerId: step.activePlayerId,
      });
      setStep(next);
      onStep?.(next);
    } catch (cause) {
      if (cause instanceof EngineError && cause.kind === 'conflict' && cause.currentStep) {
        setStep(cause.currentStep);
        onStep?.(cause.currentStep);
      } else setError(cause instanceof Error ? cause.message : 'Could not change scenes.');
    } finally { busyRef.current = false; setBusy(false); }
  }, [engine, onStep, step, stopMedia]);

  const playLines = useCallback((from: number) => {
    if (!step) return;
    stopMedia();
    const token = generation.current;
    const lines = step.node.lines;
    const advanceLine = (index: number) => {
      if (token !== generation.current) return;
      if (index + 1 < lines.length) { setLineIndex(index + 1); play(index + 1); }
      else if (step.node.type === 'scene' && step.node.autoAdvance && step.node.interaction.type === 'continue' && autoAdvanced.current !== `${step.node.id}:${step.version}`) {
        autoAdvanced.current = `${step.node.id}:${step.version}`;
        void answer({ kind: 'continue' });
      }
    };
    const play = (index: number) => {
      const line = lines[index];
      if (!line || token !== generation.current) return;
      setLineIndex(index);
      const speaker = step.node.speakers.find((item) => item.id === line.speakerId);
      const speech = () => {
        if (typeof speechSynthesis === 'undefined' || typeof SpeechSynthesisUtterance === 'undefined') return;
        const utterance = new SpeechSynthesisUtterance(line.text);
        utterance.pitch = speaker?.voice?.pitch ?? 1;
        utterance.rate = speaker?.voice?.rate ?? 1;
        utterance.onend = () => advanceLine(index);
        speechSynthesis.speak(utterance);
      };
      if (line.audioUrl) {
        const sound = new Audio(line.audioUrl);
        audio.current = sound;
        sound.onended = () => advanceLine(index);
        sound.onerror = speech;
        void sound.play().catch(speech);
      } else speech();
    };
    play(from);
  }, [answer, step, stopMedia]);

  useEffect(() => {
    if (!step) return;
    const defaultOn = step.ageGroupId === '1-2' || step.ageGroupId === '3-5' || step.ageGroupId === '6-9';
    if (narration === undefined) setNarration(defaultOn);
    if (narration && step.node.lines.length && step.ageGroupId !== '1-2' && step.ageGroupId !== '3-5') playLines(0);
  // Only start narration when a new step arrives; replay and toggle use explicit handlers.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.node.id, step?.version]);

  if (!step) return <section className={styles.player} aria-label="Story player">{error ? <p role="alert">{error}</p> : <p role="status">Loading story…</p>}</section>;
  const node = step.node;
  const minTarget = step.ageGroupId === '1-2' || step.ageGroupId === '3-5' ? 64 : step.ageGroupId === '6-9' ? 48 : 44;
  const young = step.ageGroupId === '1-2' || step.ageGroupId === '3-5';
  const currentLine = node.lines[lineIndex];
  const speaker = node.speakers.find((item) => item.id === currentLine?.speakerId);
  const assigned = new Set<string>();
  const characters = node.characters.slice(0, 3).map((character) => {
    const position = assigned.has(character.position) ? slots.find((slot) => !assigned.has(slot))! : character.position;
    assigned.add(position);
    return { ...character, position };
  });
  return <section className={`${styles.player} ${young ? styles.young : ''}`} aria-label="Story player" style={{ ...themeStyle(theme), '--mp-min-target': `${minTarget}px` } as CSSProperties}>
    <header className={styles.header}>
      <p className={styles.kicker}>Mystira · The Manor</p>
      <h1>{node.title ?? 'Story scene'}</h1>
      {step.progress && <p className={styles.progress}>Scene {step.progress.done + 1} of {step.progress.total}</p>}
    </header>
    <div className={styles.stage} key={`${node.id}:${step.version}`}>
      {node.media.video ? <video ref={video} src={node.media.video.url} poster={node.media.video.posterUrl} controls playsInline onEnded={() => { if (node.media.video?.onEnd === 'advance' && node.interaction.type === 'continue') void answer({ kind: 'continue' }); }} />
        : node.media.imageUrl ? <img className={styles.media} src={node.media.imageUrl} alt={node.media.alt ?? ''} />
          : <div className={styles.mediaFallback} aria-hidden="true">✦</div>}
      {characters.map((character) => <button className={`${styles.character} ${styles[character.position]} ${reaction === character.id ? styles.reaction : ''}`} key={character.id} type="button" disabled={!character.reactions?.length} aria-label={`${character.alt}${character.reactions?.length ? ', react' : ''}`} onClick={() => { setReaction(character.id); window.setTimeout(() => setReaction(undefined), 450); }}><img src={character.imageUrl} alt="" /></button>)}
      {node.overlays.map((overlay) => <span className={styles.overlay} key={overlay.id} style={{ left: `clamp(5%, ${overlay.anchor.x * 100}%, 95%)`, top: `clamp(8%, ${overlay.anchor.y * 100}%, 92%)`, maxWidth: overlay.maxWidth ? `${overlay.maxWidth * 100}%` : undefined }}>{overlay.text}</span>)}
      {node.media.video?.skippable && node.interaction.type === 'continue' && <button className={styles.skip} type="button" disabled={busy} onClick={() => void answer({ kind: 'continue' })}>Skip video</button>}
    </div>
    {node.task && <p className={styles.task}>{node.task.text}</p>}
    <div className={styles.dialogue} aria-live="polite">
      {currentLine && <><div className={styles.speaker}>{speaker?.avatarUrl && <img src={speaker.avatarUrl} alt="" />}<strong>{speaker?.name ?? 'Narrator'}</strong></div><p>{young ? currentLine.text.split(/[.!?]/)[0] : currentLine.text}</p></>}
      {node.lines.length > 1 && <div className={styles.lineControls}><span>Line {lineIndex + 1} of {node.lines.length}</span><button type="button" disabled={lineIndex >= node.lines.length - 1} onClick={() => { stopMedia(); setLineIndex((index) => index + 1); }}>Show next line</button></div>}
    </div>
    <div className={styles.actions}>
      <button type="button" disabled={busy || !step.canGoBack} hidden={!step.canGoBack} onClick={() => void answer({ kind: 'back' })}>Back</button>
      <button type="button" onClick={() => { setNarration((value) => !value); stopMedia(); }}>{narration ? 'Narration on' : 'Narration off'}</button>
      <button type="button" onClick={() => playLines(lineIndex)}>Replay line</button>
      {node.interaction.type === 'continue' ? <button className={styles.next} type="button" disabled={busy} onClick={() => void answer({ kind: 'continue' })}>Next</button> : <p role="status">This interaction is not available in the core preview yet.</p>}
    </div>
    {notesEnabled && isDemoMode && node.rationale && <aside className={styles.notes}><h2>Grown-up note</h2><p>{node.title}</p><p>{node.rationale.differs ? 'Different for each child' : 'Same for every child'}</p><p>{node.rationale.text}</p></aside>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
  </section>;
}
