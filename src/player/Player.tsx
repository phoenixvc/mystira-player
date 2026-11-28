import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { EngineError, type Answer, type Engine, type StartSessionRequest, type Step } from '../engine/types';
import styles from './Player.module.css';
import { manorTheme, themeStyle, type PlayerTheme } from '../theme/tokens';
import { interactionMode } from './interactionMode';
import { practiceFeedback } from './feedbackLadder';

type Props = {
  engine: Engine;
  startRequest: StartSessionRequest;
  notesEnabled?: boolean;
  isDemoMode?: boolean;
  grownUpAuthorized?: boolean;
  onStep?: (step: Step) => void;
  theme?: PlayerTheme;
  initialGesture?: boolean;
};

const slots = ['left', 'center', 'right'] as const;

export function Player({ engine, startRequest, notesEnabled = false, isDemoMode = false, grownUpAuthorized = false, onStep, theme = manorTheme, initialGesture = false }: Props) {
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;
  const [step, setStep] = useState<Step>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [narration, setNarration] = useState<boolean>();
  const [hasGesture, setHasGesture] = useState(initialGesture);
  const [lineIndex, setLineIndex] = useState(0);
  const [reaction, setReaction] = useState<string>();
  const [selected, setSelected] = useState<Answer>();
  const [wrongTries, setWrongTries] = useState(0);
  const [feedback, setFeedback] = useState<string>();
  const [reveal, setReveal] = useState(false);
  const [wrongMotion, setWrongMotion] = useState(false);
  const [held, setHeld] = useState<{ answer: Answer; image?: { imageUrl: string; alt: string }; line: { text: string; audioUrl?: string } }>();
  const [heldReady, setHeldReady] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const audio = useRef<HTMLAudioElement | undefined>(undefined);
  const video = useRef<HTMLVideoElement>(null);
  const request = useRef<{ key: string; id: string; answer: Answer } | undefined>(undefined);
  const generation = useRef(0);
  const requestGeneration = useRef(0);
  const inFlight = useRef<AbortController | undefined>(undefined);
  const busyRef = useRef(false);
  const autoAdvanced = useRef<string | undefined>(undefined);
  const narrationStartedFor = useRef<string | undefined>(undefined);
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const stopMedia = useCallback(() => {
    generation.current += 1;
    audio.current?.pause();
    audio.current = undefined;
    video.current?.pause();
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
    if (reactionTimer.current) clearTimeout(reactionTimer.current);
  }, []);

  const beginRequest = useCallback(() => {
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    return controller;
  }, []);

  const playReaction = useCallback((frequency = 520) => {
    const AudioContextType = window.AudioContext;
    if (!AudioContextType) return;
    const context = new AudioContextType();
    const tone = context.createOscillator();
    const gain = context.createGain();
    tone.type = 'sine';
    tone.frequency.value = frequency;
    gain.gain.setValueAtTime(0.025, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12);
    tone.connect(gain).connect(context.destination);
    tone.start();
    tone.stop(context.currentTime + 0.12);
    tone.onended = () => { void context.close(); };
  }, []);

  useEffect(() => {
    const markGesture = () => setHasGesture(true);
    window.addEventListener('pointerdown', markGesture, { once: true });
    window.addEventListener('keydown', markGesture, { once: true });
    return () => { window.removeEventListener('pointerdown', markGesture); window.removeEventListener('keydown', markGesture); };
  }, []);

  useEffect(() => {
    let active = true;
    requestGeneration.current += 1;
    stopMedia();
    setStep(undefined);
    setError(undefined);
    setBusy(true);
    busyRef.current = true;
    request.current = undefined;
    const controller = beginRequest();
    engine.startSession(startRequest, { signal: controller.signal }).then((next) => {
      if (active) { setStep(next); onStepRef.current?.(next); }
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'Could not start the story.');
    }).finally(() => { if (inFlight.current === controller) inFlight.current = undefined; if (active) { setBusy(false); busyRef.current = false; } });
    return () => { active = false; requestGeneration.current += 1; inFlight.current?.abort(); controller.abort(); stopMedia(); };
  }, [engine, startRequest, stopMedia, beginRequest]);

  useEffect(() => {
    stopMedia();
    setLineIndex(0);
    setReaction(undefined);
    setSelected(undefined);
    setWrongTries(0);
    setFeedback(undefined);
    setReveal(false);
    setWrongMotion(false);
    setHeld(undefined);
    setHeldReady(false);
    setImageFailed(false);
    autoAdvanced.current = undefined;
  }, [step?.node.id, step?.version, stopMedia]);

  const answer = useCallback(async (value: Answer, submittedWrongTries?: number) => {
    if (!step || busyRef.current) return;
    stopMedia();
    const token = requestGeneration.current;
    busyRef.current = true;
    setBusy(true);
    setError(undefined);
    const key = `${step.sessionId}:${step.node.id}:${step.version}`;
    if (request.current?.key !== key || JSON.stringify(request.current.answer) !== JSON.stringify(value)) {
      request.current = { key, id: crypto.randomUUID(), answer: value };
    }
    const controller = beginRequest();
    try {
      const next = await engine.respond(step.sessionId, {
        answerRequestId: request.current.id, version: step.version, nodeId: step.node.id,
        answer: value, playerId: step.activePlayerId,
        ...(submittedWrongTries === undefined ? {} : { wrongTries: submittedWrongTries }),
      }, { signal: controller.signal });
      if (token !== requestGeneration.current) return;
      setStep(next);
      onStepRef.current?.(next);
    } catch (cause) {
      if (token !== requestGeneration.current) return;
      if (cause instanceof EngineError && cause.kind === 'conflict' && cause.currentStep) {
        setStep(cause.currentStep);
        onStepRef.current?.(cause.currentStep);
      } else setError(cause instanceof Error ? cause.message : 'Could not change scenes.');
    } finally { if (inFlight.current === controller) inFlight.current = undefined; if (token === requestGeneration.current) { busyRef.current = false; setBusy(false); } }
  }, [engine, step, stopMedia, beginRequest]);

  const playAgain = useCallback(async () => {
    if (busyRef.current) return;
    requestGeneration.current += 1;
    stopMedia();
    const token = requestGeneration.current;
    busyRef.current = true;
    setBusy(true);
    setError(undefined);
    request.current = undefined;
    const controller = beginRequest();
    try {
      const next = await engine.startSession(startRequest, { signal: controller.signal });
      if (token !== requestGeneration.current) return;
      setStep(next);
      onStepRef.current?.(next);
    } catch (cause) {
      if (token === requestGeneration.current) setError(cause instanceof Error ? cause.message : 'Could not restart the story.');
    } finally { if (inFlight.current === controller) inFlight.current = undefined; if (token === requestGeneration.current) { busyRef.current = false; setBusy(false); } }
  }, [engine, startRequest, stopMedia, beginRequest]);

  const playLines = useCallback((from: number) => {
    if (!step) return;
    narrationStartedFor.current = `${step.sessionId}:${step.node.id}:${step.version}`;
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
      let fallbackStarted = false;
      const speech = () => {
        if (fallbackStarted || token !== generation.current) return;
        fallbackStarted = true;
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

  const choose = useCallback((value: Extract<Answer, { kind: 'choice' | 'hotspot' }>) => {
    if (!step || busyRef.current || held) return;
    const interaction = step.node.interaction;
    if (interaction.type !== 'choices' && interaction.type !== 'hotspots') return;
    stopMedia();
    const mode = interactionMode(step.node);
    if (mode === 'check') { setSelected(value); return; }
    if (mode === 'open' || !interaction.local) { void answer(value); return; }
    const id = value.kind === 'choice' ? value.choiceId : value.hotspotId;
    if (id !== interaction.local.correctId) {
      const count = wrongTries + 1;
      const result = practiceFeedback(interaction.local, id, count);
      setWrongTries(count);
      setFeedback(result.message.text);
      setReveal(result.revealTarget);
      setWrongMotion(true);
      playReaction(220);
      window.setTimeout(() => setWrongMotion(false), 350);
      return;
    }
    setFeedback(undefined);
    const outcome = interaction.type === 'choices' ? interaction.local.outcomes?.[id] : undefined;
    if (outcome && 'onCorrect' in outcome) {
      const presentation = outcome.onCorrect;
      setImageFailed(false);
      setHeld({ answer: value, ...presentation });
      const narrate = narration ?? (step.ageGroupId === '1-2' || step.ageGroupId === '3-5' || step.ageGroupId === '6-9');
      if (!narrate) { setHeldReady(true); return; }
      const token = generation.current;
      const finish = () => { if (token === generation.current) setHeldReady(true); };
      const speak = () => {
        if (token !== generation.current) return;
        if (typeof speechSynthesis === 'undefined' || typeof SpeechSynthesisUtterance === 'undefined') { finish(); return; }
        try {
          const utterance = new SpeechSynthesisUtterance(presentation.line.text);
          utterance.onend = finish;
          utterance.onerror = finish;
          speechSynthesis.speak(utterance);
        } catch { finish(); }
      };
      if (presentation.line.audioUrl) {
        const sound = new Audio(presentation.line.audioUrl);
        audio.current = sound;
        sound.onended = finish;
        sound.onerror = speak;
        void sound.play().catch(speak);
      } else speak();
      return;
    }
    void answer(value, wrongTries);
  }, [step, held, answer, wrongTries, narration, stopMedia, playReaction]);

  useEffect(() => {
    if (!step) return;
    const defaultOn = step.ageGroupId === '1-2' || step.ageGroupId === '3-5' || step.ageGroupId === '6-9';
    if (narration === undefined) setNarration(defaultOn);
    const key = `${step.sessionId}:${step.node.id}:${step.version}`;
    if ((narration ?? defaultOn) && step.node.lines.length && (!['1-2', '3-5'].includes(step.ageGroupId) || hasGesture) && narrationStartedFor.current !== key) playLines(0);
  // Only start narration when a new step arrives; replay and toggle use explicit handlers.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.node.id, step?.version, hasGesture]);

  if (!step) return <section className={styles.player} aria-label="Story player">{error ? <p role="alert">{error}</p> : <p role="status">Loading story…</p>}</section>;
  const node = step.node;
  if (node.type === 'result' && step.progress?.done === step.progress?.total) {
    return <section className={styles.player} aria-label="Story complete" style={themeStyle(theme)}>
      <h1>{node.title ?? 'The End'}</h1><p>You reached the end of this path.</p>
      {node.total > 0 && <p>{node.correctFirstTry} of {node.total} correct on the first try</p>}
      <div className={styles.actions}>
        {step.canGoBack && <button type="button" disabled={busy} onClick={() => void answer({ kind: 'back' })}>Back</button>}
        <button type="button" disabled={busy} onClick={() => void playAgain()}>Play again</button>
      </div>
      {error && <p role="alert" className={styles.error}>{error}</p>}
    </section>;
  }
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
    <div className={styles.stage} key={`${node.id}:${step.version}`} onClick={(event) => { if (node.interaction.type === 'hotspots' && !held && !(event.target as HTMLElement).closest('button')) setFeedback('Nothing here'); }}>
      {node.media.video && !held?.image ? <video ref={video} src={node.media.video.url} poster={node.media.video.posterUrl} controls playsInline onEnded={() => { if (node.media.video?.onEnd === 'advance' && node.interaction.type === 'continue') void answer({ kind: 'continue' }); }} />
        : (held?.image?.imageUrl ?? node.media.imageUrl) && !imageFailed ? <img className={styles.media} src={held?.image?.imageUrl ?? node.media.imageUrl} alt={held?.image?.alt ?? node.media.alt ?? ''} onError={() => setImageFailed(true)} />
          : <div className={styles.mediaFallback} role="img" aria-label={imageFailed ? held?.image?.alt ?? node.media.alt ?? 'Scene image unavailable' : 'Scene artwork'}>✦</div>}
      {characters.map((character) => <button className={`${styles.character} ${styles[character.position]} ${reaction === character.id ? styles.reaction : ''}`} key={character.id} type="button" disabled={!character.reactions?.length} aria-label={`${character.alt}${character.reactions?.length ? ', react' : ''}`} onClick={() => { setReaction(character.id); playReaction(); if (reactionTimer.current) clearTimeout(reactionTimer.current); reactionTimer.current = setTimeout(() => setReaction(undefined), 450); }}><img src={character.imageUrl} alt="" /></button>)}
      {node.overlays.map((overlay) => <span className={styles.overlayRegion} key={overlay.id}><span className={styles.overlay} tabIndex={0} style={{ left: `${overlay.anchor.x * 100}%`, top: `${overlay.anchor.y * 100}%`, transform: `translate(-${overlay.anchor.x * 100}%, -${overlay.anchor.y * 100}%)`, maxWidth: overlay.maxWidth ? `${overlay.maxWidth * 100}%` : undefined }}>{overlay.text}</span></span>)}
      {node.interaction.type === 'hotspots' && !held && node.interaction.spots.map((spot) => <button key={spot.id} type="button" className={`${styles.hotspot} ${reveal && node.interaction.type === 'hotspots' && node.interaction.local?.correctId === spot.id ? styles.revealed : ''}`} style={spot.region.shape === 'rect' ? { left: `${spot.region.x * 100}%`, top: `${spot.region.y * 100}%`, width: `${spot.region.w * 100}%`, height: `${spot.region.h * 100}%` } : { left: `${(spot.region.x - spot.region.r) * 100}%`, top: `${(spot.region.y - spot.region.r) * 100}%`, width: `${spot.region.r * 200}%`, height: `${spot.region.r * 200}%`, borderRadius: '50%' }} aria-label={spot.label} aria-pressed={selected?.kind === 'hotspot' && selected.hotspotId === spot.id} disabled={busy} onClick={() => choose({ kind: 'hotspot', hotspotId: spot.id })}><span>{spot.label}</span></button>)}
      {node.media.video?.skippable && node.interaction.type === 'continue' && <button className={styles.skip} type="button" disabled={busy} onClick={() => void answer({ kind: 'continue' })}>Skip video</button>}
    </div>
    {node.type === 'check' && <p role="status" className={styles.banner}>{node.attempt === 1 ? 'Only the first try counts' : 'This try does not count for the score'}</p>}
    {node.type === 'check' && <p className={styles.task}>{node.question.text}</p>}
    {node.type === 'research' && node.yourAnswer && <p className={styles.banner}>You chose: {node.yourAnswer}</p>}
    {node.task && <p className={styles.task}>{node.task.text}</p>}
    {node.interaction.type === 'choices' && !held && <div className={`${styles.choices} ${wrongMotion ? styles.wrongMotion : ''}`} role="group" aria-label="Choices">{node.interaction.options.map((option) => <button key={option.id} type="button" className={reveal && node.interaction.type === 'choices' && node.interaction.local?.correctId === option.id ? styles.revealed : ''} aria-pressed={selected?.kind === 'choice' && selected.choiceId === option.id} disabled={busy} onClick={() => choose({ kind: 'choice', choiceId: option.id })}>{option.label}</button>)}</div>}
    {feedback && <p role="status" className={styles.feedback}>{feedback}</p>}
    {held && <div className={styles.feedback} role="status"><p>{held.line.text}</p>{!heldReady && <button type="button" onClick={() => { stopMedia(); setHeldReady(true); }}>Continue without audio</button>}</div>}
    <div className={styles.dialogue} aria-live="polite">
      {currentLine && !(node.type === 'check' && currentLine.text === node.question.text) && <><div className={styles.speaker}>{speaker?.avatarUrl && <img src={speaker.avatarUrl} alt="" />}<strong style={{ color: speaker?.colour }}>{speaker?.name ?? 'Narrator'}</strong></div><p>{currentLine.text}</p></>}
      {node.lines.length > 1 && <div className={styles.lineControls}><span>Line {lineIndex + 1} of {node.lines.length}</span><button type="button" disabled={lineIndex >= node.lines.length - 1} onClick={() => { stopMedia(); setLineIndex((index) => index + 1); }}>Show next line</button></div>}
    </div>
    <div className={styles.actions}>
      <button type="button" disabled={busy || !step.canGoBack} hidden={!step.canGoBack} onClick={() => void answer({ kind: 'back' })}>Back</button>
      <button type="button" aria-pressed={narration ?? (step.ageGroupId === '1-2' || step.ageGroupId === '3-5' || step.ageGroupId === '6-9')} onClick={() => { const next = !(narration ?? (step.ageGroupId === '1-2' || step.ageGroupId === '3-5' || step.ageGroupId === '6-9')); setNarration(next); stopMedia(); if (!next && held) setHeldReady(true); if (next && !held) playLines(lineIndex); }}>{narration ? 'Narration on' : 'Narration off'}</button>
      <button type="button" disabled={!!held} onClick={() => playLines(lineIndex)}>Replay line</button>
      {held ? <button className={styles.next} type="button" disabled={busy || !heldReady} onClick={() => void answer(held.answer, wrongTries)}>Next</button>
        : node.type === 'check' ? <button className={styles.next} type="button" disabled={busy || !selected} onClick={() => { if (selected) void answer(selected); }}>That's my answer</button>
          : node.interaction.type === 'continue' ? <button className={styles.next} type="button" disabled={busy} onClick={() => void answer({ kind: 'continue' })}>Next</button>
            : node.interaction.type !== 'choices' && node.interaction.type !== 'hotspots' ? <p role="status">This interaction is not available in the core preview yet.</p> : null}
    </div>
    {notesEnabled && (isDemoMode || grownUpAuthorized) && node.rationale && <aside className={styles.notes}><h2>Grown-up note</h2><p>{node.title}</p><p>{node.rationale.differs ? 'Different for each child' : 'Same for every child'}</p><p>{node.rationale.text}</p></aside>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
  </section>;
}
