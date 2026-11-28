import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { EngineError, type Answer, type Engine, type StartSessionRequest, type Step } from '../engine/types';
import styles from './Player.module.css';
import { manorTheme, themeStyle, type PlayerTheme } from '../theme/tokens';
import { interactionMode } from './interactionMode';
import { practiceFeedback } from './feedbackLadder';
import type { Region } from '../schema/node';
import { SequenceView } from './SequenceView';
import { InspectView } from './InspectView';

type Props = {
  engine: Engine;
  startRequest?: StartSessionRequest;
  resumeSessionId?: string;
  notesEnabled?: boolean;
  isDemoMode?: boolean;
  grownUpAuthorized?: boolean;
  onStep?: (step: Step) => void;
  onAnswer?: (sessionId: string, nodeId: string, answerKind: Answer['kind']) => void;
  onError?: (kind: EngineError['kind'], retryable: boolean) => void;
  theme?: PlayerTheme;
  inheritTheme?: boolean;
  muted?: boolean;
  initialGesture?: boolean;
};

const slots = ['left', 'center', 'right'] as const;

export function Player({ engine, startRequest, resumeSessionId, notesEnabled = false, isDemoMode = false, grownUpAuthorized = false, onStep, onAnswer, onError, theme = manorTheme, inheritTheme = false, muted = false, initialGesture = false }: Props) {
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;
  const onAnswerRef = useRef(onAnswer);
  onAnswerRef.current = onAnswer;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
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
  const [sequenceRevealId, setSequenceRevealId] = useState<string>();
  const [inspectRevealIds, setInspectRevealIds] = useState<string[]>([]);
  const [wrongMotion, setWrongMotion] = useState(false);
  const [held, setHeld] = useState<{ answer: Answer; image?: { imageUrl: string; alt: string }; line: { text: string; audioUrl?: string }; spot?: { region: Region; text: string; imageUrl?: string; alt?: string } }>();
  const [heldReady, setHeldReady] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [keyImageFailed, setKeyImageFailed] = useState(false);
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
  const rollContinue = useRef<HTMLButtonElement>(null);

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
    if (muted) return;
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
  }, [muted]);

  useEffect(() => { if (muted) stopMedia(); }, [muted, stopMedia]);

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
    const pending = resumeSessionId ? engine.resumeSession(resumeSessionId, { signal: controller.signal })
      : startRequest ? engine.startSession(startRequest, { signal: controller.signal })
        : Promise.reject(new EngineError('notFound', 'A start request or session ID is required.'));
    pending.then((next) => {
      if (active) { setStep(next); onStepRef.current?.(next); }
    }).catch((cause: unknown) => {
      if (active) { setError(cause instanceof Error ? cause.message : 'Could not start the story.'); onErrorRef.current?.(cause instanceof EngineError ? cause.kind : 'server', cause instanceof EngineError && cause.kind === 'network'); }
    }).finally(() => { if (inFlight.current === controller) inFlight.current = undefined; if (active) { setBusy(false); busyRef.current = false; } });
    return () => { active = false; requestGeneration.current += 1; inFlight.current?.abort(); controller.abort(); stopMedia(); };
  }, [engine, startRequest, resumeSessionId, stopMedia, beginRequest]);

  useEffect(() => {
    stopMedia();
    setLineIndex(0);
    setReaction(undefined);
    setSelected(undefined);
    setWrongTries(0);
    setFeedback(undefined);
    setReveal(false);
    setSequenceRevealId(undefined);
    setInspectRevealIds([]);
    setWrongMotion(false);
    setHeld(undefined);
    setHeldReady(false);
    setImageFailed(false);
    setKeyImageFailed(false);
    autoAdvanced.current = undefined;
  }, [step?.node.id, step?.version, stopMedia]);

  useEffect(() => {
    if (step?.node.interaction.type === 'roll' && step.node.interaction.state === 'resolved') rollContinue.current?.focus();
  }, [step]);

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
      onAnswerRef.current?.(step.sessionId, step.node.id, value.kind);
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
      } else { setError(cause instanceof Error ? cause.message : 'Could not change scenes.'); onErrorRef.current?.(cause instanceof EngineError ? cause.kind : 'server', cause instanceof EngineError && cause.kind === 'network'); }
    } finally { if (inFlight.current === controller) inFlight.current = undefined; if (token === requestGeneration.current) { busyRef.current = false; setBusy(false); } }
  }, [engine, step, stopMedia, beginRequest]);

  const playAgain = useCallback(async () => {
    if (busyRef.current || !startRequest) return;
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
      if (token === requestGeneration.current) { setError(cause instanceof Error ? cause.message : 'Could not restart the story.'); onErrorRef.current?.(cause instanceof EngineError ? cause.kind : 'server', cause instanceof EngineError && cause.kind === 'network'); }
    } finally { if (inFlight.current === controller) inFlight.current = undefined; if (token === requestGeneration.current) { busyRef.current = false; setBusy(false); } }
  }, [engine, startRequest, stopMedia, beginRequest]);

  const playLines = useCallback((from: number) => {
    if (!step || muted) return;
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
  }, [answer, step, stopMedia, muted]);

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
    if (interaction.type === 'hotspots') {
      const spot = interaction.spots.find((item) => item.id === id);
      if (spot?.reveal) {
        setHeld({ answer: value, line: { text: spot.reveal.text }, spot: { region: spot.region, ...spot.reveal } });
        setHeldReady(true);
        return;
      }
    }
    const outcome = interaction.type === 'choices' ? interaction.local.outcomes?.[id] : undefined;
    if (outcome && 'onCorrect' in outcome) {
      const presentation = outcome.onCorrect;
      setImageFailed(false);
      setHeld({ answer: value, ...presentation });
      const narrate = narration ?? (step.ageGroupId === '1-2' || step.ageGroupId === '3-5' || step.ageGroupId === '6-9');
      if (muted || !narrate) { setHeldReady(true); return; }
      const token = generation.current;
      const finish = () => { if (token === generation.current) setHeldReady(true); };
      let fallbackStarted = false;
      const speak = () => {
        if (fallbackStarted || token !== generation.current) return;
        fallbackStarted = true;
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
  }, [step, held, answer, wrongTries, narration, muted, stopMedia, playReaction]);

  const submitSequence = useCallback((itemIds: string[]) => {
    if (!step || step.node.interaction.type !== 'sequence' || busyRef.current) return;
    stopMedia();
    const value: Answer = { kind: 'sequence', itemIds };
    const mode = interactionMode(step.node);
    if (mode === 'check') { setSelected(value); setFeedback('Order selected. Confirm when ready.'); return; }
    const local = step.node.interaction.local;
    if (mode === 'practice' && local && itemIds.some((id, index) => id !== local.order[index])) {
      const count = wrongTries + 1;
      const result = practiceFeedback(local, '', count);
      setWrongTries(count);
      setFeedback(result.message.text);
      setReveal(result.revealTarget);
      setSequenceRevealId(result.revealTarget ? local.order.find((id, index) => itemIds[index] !== id) : undefined);
      setWrongMotion(true);
      playReaction(220);
      window.setTimeout(() => setWrongMotion(false), 350);
      return;
    }
    setFeedback(undefined);
    void answer(value, wrongTries);
  }, [step, answer, wrongTries, stopMedia, playReaction]);

  const submitInspect = useCallback((partIds: string[]) => {
    if (!step || step.node.interaction.type !== 'inspect' || busyRef.current) return;
    stopMedia();
    const value: Answer = { kind: 'inspect', partIds };
    const mode = interactionMode(step.node);
    if (mode === 'check') { setSelected(value); setFeedback('Marks selected. Confirm when ready.'); return; }
    const local = step.node.interaction.local;
    if (mode === 'practice' && local && (partIds.length !== local.flagged.length || local.flagged.some((id) => !partIds.includes(id)))) {
      const count = wrongTries + 1;
      const result = practiceFeedback(local, '', count);
      setWrongTries(count);
      setFeedback(result.message.text);
      const missing = local.flagged.filter((id) => !partIds.includes(id));
      setInspectRevealIds(result.revealTarget ? missing.length ? missing : partIds.filter((id) => !local.flagged.includes(id)) : []);
      setWrongMotion(true);
      playReaction(220);
      window.setTimeout(() => setWrongMotion(false), 350);
      return;
    }
    setFeedback(undefined);
    void answer(value, wrongTries);
  }, [step, answer, wrongTries, stopMedia, playReaction]);

  useEffect(() => {
    if (!step) return;
    const defaultOn = step.ageGroupId === '1-2' || step.ageGroupId === '3-5' || step.ageGroupId === '6-9';
    if (narration === undefined) setNarration(defaultOn);
    const key = `${step.sessionId}:${step.node.id}:${step.version}`;
    if (!muted && (narration ?? defaultOn) && step.node.lines.length && (!['1-2', '3-5'].includes(step.ageGroupId) || hasGesture) && narrationStartedFor.current !== key) playLines(0);
  // Only start narration when a new step arrives; replay and toggle use explicit handlers.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.node.id, step?.version, hasGesture]);

  if (!step) return <section className={styles.player} aria-label="Story player" onPointerDownCapture={() => setHasGesture(true)} onKeyDownCapture={() => setHasGesture(true)}>{error ? <p role="alert">{error}</p> : <p role="status">Loading story…</p>}</section>;
  const node = step.node;
  const inspectParts = node.interaction.type === 'inspect' ? node.interaction.document.parts : [];
  if (node.type === 'result' && node.id === 'story-end') {
    return <section className={styles.player} aria-label="Story complete" style={inheritTheme ? undefined : themeStyle(theme)} onPointerDownCapture={() => setHasGesture(true)} onKeyDownCapture={() => setHasGesture(true)}>
      <h1>{node.title ?? 'The End'}</h1><p>You reached the end of this path.</p>
      {node.total > 0 && <p>{node.correctFirstTry} of {node.total} correct on the first try</p>}
      <div className={styles.actions}>
        {step.canGoBack && <button type="button" disabled={busy} onClick={() => void answer({ kind: 'back' })}>Back</button>}
        {startRequest && <button type="button" disabled={busy} onClick={() => void playAgain()}>Play again</button>}
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
  return <section className={`${styles.player} ${young ? styles.young : ''}`} aria-label="Story player" style={{ ...(inheritTheme ? {} : themeStyle(theme)), '--mp-min-target': `${minTarget}px` } as CSSProperties} onPointerDownCapture={() => setHasGesture(true)} onKeyDownCapture={() => setHasGesture(true)}>
    <header className={styles.header}>
      <p className={styles.kicker}>Mystira · The Manor</p>
      <h1>{node.title ?? 'Story scene'}</h1>
      {step.progress && <p className={styles.progress}>{node.type === 'result' ? 'Result' : `Scene ${step.progress.done + 1} of ${step.progress.total}`}</p>}
    </header>
    <div className={styles.stage} key={`${node.id}:${step.version}`} onClick={(event) => { if (node.interaction.type === 'hotspots' && !held && !(event.target as HTMLElement).closest('button')) setFeedback('Nothing here'); }}>
      {node.media.video && !held?.image ? <video ref={video} src={node.media.video.url} poster={node.media.video.posterUrl} controls playsInline muted={muted} onEnded={() => { if (node.media.video?.onEnd === 'advance' && node.interaction.type === 'continue') void answer({ kind: 'continue' }); }} />
        : (held?.image?.imageUrl ?? node.media.imageUrl) && !imageFailed ? <img className={styles.media} src={held?.image?.imageUrl ?? node.media.imageUrl} alt={held?.image?.alt ?? node.media.alt ?? ''} onError={() => setImageFailed(true)} />
          : <div className={styles.mediaFallback} role="img" aria-label={imageFailed ? held?.image?.alt ?? node.media.alt ?? 'Scene image unavailable' : 'Scene artwork'}>✦</div>}
      {!node.media.video && !held?.image && node.media.layers?.map((layer) => <img key={layer.id} className={styles.stageLayer} src={layer.imageUrl} alt={layer.alt} style={{ left: `${layer.left}%`, bottom: `${layer.bottom}%`, width: `${layer.width}%`, height: layer.height ? `${layer.height}%` : undefined }} />)}
      {characters.map((character) => <button className={`${styles.character} ${styles[character.position]} ${reaction === character.id ? styles.reaction : ''}`} key={character.id} type="button" disabled={!character.reactions?.length} aria-label={`${character.alt}${character.reactions?.length ? ', react' : ''}`} onClick={() => { setReaction(character.id); playReaction(); if (reactionTimer.current) clearTimeout(reactionTimer.current); reactionTimer.current = setTimeout(() => setReaction(undefined), 450); }}><img src={character.imageUrl} alt="" /></button>)}
      {node.interaction.type === 'roll' && <div className={`${styles.rollPanel} ${node.interaction.state === 'resolved' ? styles.rollResolved : ''}`} role="region" aria-label="Roll challenge" tabIndex={0}>
        {node.interaction.state === 'ready' ? <><p>Time to test your luck!</p>{node.interaction.target && <p>Roll target <strong>{node.interaction.target}</strong> or higher</p>}<button type="button" disabled={busy} onClick={() => void answer({ kind: 'roll' })}>Roll</button></>
          : node.interaction.result && <div role="status"><p>You rolled <strong>{node.interaction.result.value}</strong>{node.interaction.target && <> vs {node.interaction.target}</>}</p><p>{node.interaction.result.message}</p></div>}
      </div>}
      {node.overlays.map((overlay) => <span className={styles.overlayRegion} key={overlay.id}><span className={styles.overlay} tabIndex={0} style={{ left: `${overlay.anchor.x * 100}%`, top: `${overlay.anchor.y * 100}%`, transform: `translate(-${overlay.anchor.x * 100}%, -${overlay.anchor.y * 100}%)`, maxWidth: overlay.maxWidth ? `${overlay.maxWidth * 100}%` : undefined }}>{overlay.text}</span></span>)}
      {node.interaction.type === 'hotspots' && !held && node.interaction.spots.map((spot) => <button key={spot.id} type="button" className={`${styles.hotspot} ${reveal && node.interaction.type === 'hotspots' && node.interaction.local?.correctId === spot.id ? styles.revealed : ''}`} style={spot.region.shape === 'rect' ? { left: `${spot.region.x * 100}%`, top: `${spot.region.y * 100}%`, width: `${spot.region.w * 100}%`, height: `${spot.region.h * 100}%` } : { left: `${(spot.region.x - spot.region.r) * 100}%`, top: `${(spot.region.y - spot.region.r) * 100}%`, width: `${spot.region.r * 200}%`, height: `${spot.region.r * 200}%`, borderRadius: '50%' }} aria-label={spot.label} aria-pressed={selected?.kind === 'hotspot' && selected.hotspotId === spot.id} disabled={busy} onClick={() => choose({ kind: 'hotspot', hotspotId: spot.id })}><span>{spot.label}</span></button>)}
      {held?.spot && <div className={styles.hotspotReveal} role="status" style={held.spot.region.shape === 'rect' ? { left: `${held.spot.region.x * 100}%`, top: `${held.spot.region.y * 100}%` } : { left: `${held.spot.region.x * 100}%`, top: `${held.spot.region.y * 100}%` }}>{held.spot.imageUrl && <img src={held.spot.imageUrl} alt={held.spot.alt ?? held.spot.text} />}<p>{held.spot.text}</p></div>}
      {node.media.video?.skippable && node.interaction.type === 'continue' && <button className={styles.skip} type="button" disabled={busy} onClick={() => void answer({ kind: 'continue' })}>Skip video</button>}
    </div>
    {node.type === 'check' && <p role="status" className={styles.banner}>{node.attempt === 1 ? 'Only the first try counts' : 'This try does not count for the score'}</p>}
    {node.type === 'check' && <p className={styles.task}>{node.question.text}</p>}
    {node.type === 'research' && node.yourAnswer && <p className={styles.banner}>You chose: {node.yourAnswer}</p>}
    {node.task && <p className={styles.task}>{node.task.text}</p>}
    {node.interaction.type === 'choices' && !held && <div className={`${styles.choices} ${wrongMotion ? styles.wrongMotion : ''}`} role="group" aria-label="Choices">{node.interaction.options.map((option) => <button key={option.id} type="button" className={reveal && node.interaction.type === 'choices' && node.interaction.local?.correctId === option.id ? styles.revealed : ''} aria-pressed={selected?.kind === 'choice' && selected.choiceId === option.id} disabled={busy} onClick={() => choose({ kind: 'choice', choiceId: option.id })}>{option.label}</button>)}</div>}
    {node.interaction.type === 'sequence' && <div className={wrongMotion ? styles.wrongMotion : undefined}><SequenceView key={`${step.sessionId}:${node.id}:${step.version}`} items={node.interaction.items} disabled={busy} revealId={sequenceRevealId} onEdit={() => { stopMedia(); setSelected(undefined); setFeedback(undefined); setSequenceRevealId(undefined); }} onDone={submitSequence} /></div>}
    {node.interaction.type === 'inspect' && <div className={wrongMotion ? styles.wrongMotion : undefined}><InspectView key={`${step.sessionId}:${node.id}:${step.version}`} document={node.interaction.document} minMarks={node.interaction.minMarks ?? 1} disabled={busy} revealIds={inspectRevealIds} onEdit={() => { stopMedia(); setSelected(undefined); setFeedback(undefined); setInspectRevealIds([]); }} onDone={submitInspect} /></div>}
    {sequenceRevealId && node.interaction.type === 'sequence' && <p role="status" className={styles.feedback}>Look at {node.interaction.items.find((item) => item.id === sequenceRevealId)?.label} and try that position again.</p>}
    {inspectRevealIds.length > 0 && node.interaction.type === 'inspect' && <p role="status" className={styles.feedback}>Look again at {inspectRevealIds.map((id) => inspectParts.find((part) => part.id === id)?.text).join(', ')}.</p>}
    {feedback && <p role="status" className={styles.feedback}>{feedback}</p>}
    {held && !held.spot && <div className={styles.feedback} role="status"><p>{held.line.text}</p>{!heldReady && <button type="button" onClick={() => { stopMedia(); setHeldReady(true); }}>Continue without audio</button>}</div>}
    <div className={styles.dialogue} aria-live="polite">
      {currentLine && !(node.type === 'check' && currentLine.text === node.question.text) && <><div className={styles.speaker}>{speaker?.avatarUrl && <img src={speaker.avatarUrl} alt="" />}<strong style={{ color: speaker?.colour }}>{speaker?.name ?? 'Narrator'}</strong></div><p>{currentLine.text}</p></>}
      {node.lines.length > 1 && <div className={styles.lineControls}><span>Line {lineIndex + 1} of {node.lines.length}</span><button type="button" disabled={!!held || lineIndex >= node.lines.length - 1} onClick={() => { stopMedia(); setLineIndex((index) => index + 1); }}>Show next line</button></div>}
    </div>
    {node.type === 'result' && <aside className={styles.feedback} aria-label="Lesson result">{node.total > 0 && <p>{node.correctFirstTry} of {node.total} correct on the first try</p>}{node.key && <div className={styles.resultKey}>{node.key.iconUrl && !keyImageFailed ? <img src={node.key.iconUrl} alt="" onError={() => setKeyImageFailed(true)} /> : <span aria-hidden="true">✦</span>}<strong>{node.key.label}</strong></div>}</aside>}
    {node.type !== 'terminal' && <div className={styles.actions}>
      <button type="button" disabled={busy || !step.canGoBack} hidden={!step.canGoBack} onClick={() => void answer({ kind: 'back' })}>Back</button>
      <button type="button" aria-pressed={narration ?? (step.ageGroupId === '1-2' || step.ageGroupId === '3-5' || step.ageGroupId === '6-9')} onClick={() => { const next = !(narration ?? (step.ageGroupId === '1-2' || step.ageGroupId === '3-5' || step.ageGroupId === '6-9')); setNarration(next); stopMedia(); if (!next && held) setHeldReady(true); if (next && !held) playLines(lineIndex); }}>{narration ? 'Narration on' : 'Narration off'}</button>
      <button type="button" disabled={!!held} onClick={() => playLines(lineIndex)}>Replay line</button>
      {node.type === 'result' ? startRequest && <button className={styles.next} type="button" disabled={busy} onClick={() => void playAgain()}>Play again</button>
        : held ? <button className={styles.next} type="button" disabled={busy || !heldReady} onClick={() => void answer(held.answer, wrongTries)}>Next</button>
        : node.type === 'check' ? <button className={styles.next} type="button" disabled={busy || !selected} onClick={() => { if (selected) void answer(selected); }}>That's my answer</button>
          : node.interaction.type === 'continue' ? <button className={styles.next} type="button" disabled={busy} onClick={() => void answer({ kind: 'continue' })}>Next</button>
            : node.interaction.type === 'roll' && node.interaction.state === 'resolved' ? <button ref={rollContinue} className={styles.next} type="button" disabled={busy} onClick={() => void answer({ kind: 'continue' })}>Continue adventure</button>
              : node.interaction.type !== 'roll' && node.interaction.type !== 'choices' && node.interaction.type !== 'hotspots' && node.interaction.type !== 'sequence' && node.interaction.type !== 'inspect' ? <p role="status">This interaction is not available in the core preview yet.</p> : null}
    </div>}
    {notesEnabled && (isDemoMode || grownUpAuthorized) && node.rationale && <aside className={styles.notes}><h2>Grown-up note</h2><p>{node.title}</p><p>{node.rationale.differs ? 'Different for each child' : 'Same for every child'}</p><p>{node.rationale.text}</p></aside>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
  </section>;
}
