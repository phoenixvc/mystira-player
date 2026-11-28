import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Player } from './Player';
import type { Engine, Step } from '../engine/types';
import type { LanguagePair } from './LanguageExplorer';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

const first: Step = {
  sessionId: 's1', version: '1', ageGroupId: '6-9', players: [], canGoBack: false,
  progress: { done: 0, total: 2 },
  node: { type: 'scene', id: 'gate', title: 'At the gate', media: { imageUrl: '/gate.webp', alt: 'A friendly gate' }, characters: [], speakers: [], lines: [{ speakerId: 'narrator', text: 'Welcome.' }], task: { text: 'Look at the gate.' }, overlays: [{ id: 'note', text: 'A clue', anchor: { x: 0.5, y: 0.5 }, align: 'center', style: 'callout' }], rationale: { differs: true, text: 'A different way in.' }, interaction: { type: 'continue' } },
};
const second: Step = { ...first, version: '2', canGoBack: true, progress: { done: 1, total: 2 }, node: { ...first.node, id: 'hall', title: 'In the hall' } };

describe('Player', () => {
  it('keeps language replay separate from the story engine answer', async () => {
    const pair: LanguagePair = { sceneId: 'gate', lineIndex: 0, en: { text: 'Welcome.', audioUrl: '/en.mp3' }, af: { text: 'Welkom.', audioUrl: '/af.mp3' }, links: [] };
    const respond = vi.fn().mockResolvedValue(second);
    const engine: Engine = { startSession: vi.fn().mockResolvedValue(first), resumeSession: vi.fn(), respond };
    const played: string[] = [];
    vi.stubGlobal('Audio', class {
      constructor(public src: string) { played.push(src); }
      pause = vi.fn();
      play = vi.fn().mockResolvedValue(undefined);
    });
    render(<Player engine={engine} startRequest={{ activityId: 'story', players: [] }} languagePair={() => pair} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Compare English and Afrikaans' }));
    fireEvent.click(screen.getByRole('button', { name: 'Hoor Afrikaans weer' }));
    expect(played).toContain('/af.mp3');
    expect(respond).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(respond).toHaveBeenCalledOnce());
  });
  it('shows a generic story ending without a score or submission control', async () => {
    const terminal: Step = { ...first, node: { ...first.node, type: 'terminal', title: 'The story ends', interaction: { type: 'terminal' }, lines: [{ speakerId: 'narrator', text: 'Everyone is safe.' }] } };
    const engine: Engine = { startSession: vi.fn().mockResolvedValue(terminal), resumeSession: vi.fn(), respond: vi.fn() };
    render(<Player engine={engine} startRequest={{ activityId: 'story', players: [] }} muted />);
    expect(await screen.findByRole('heading', { name: 'The story ends' })).toBeTruthy();
    expect(screen.getByText('Everyone is safe.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull();
    expect(screen.queryByText(/correct on the first try/i)).toBeNull();
    expect(engine.respond).not.toHaveBeenCalled();
  });
  it('asks the host to roll once, displays its resolved outcome, then continues without deciding success', async () => {
    const ready: Step = { ...first, node: { ...first.node, lines: [], interaction: { type: 'roll', state: 'ready', target: 3 } } };
    const resolved: Step = { ...ready, version: '2', node: { ...ready.node, interaction: { type: 'roll', state: 'resolved', target: 3, result: { value: 2, success: false, message: 'A gentle miss.' } } } };
    const respond = vi.fn().mockResolvedValueOnce(resolved).mockResolvedValueOnce(second);
    const engine: Engine = { startSession: vi.fn().mockResolvedValue(ready), resumeSession: vi.fn(), respond };
    render(<Player engine={engine} startRequest={{ activityId: 'story', players: [] }} />);
    const roll = await screen.findByRole('button', { name: 'Roll' });
    expect(screen.getByRole('region', { name: 'Roll challenge' }).getAttribute('tabindex')).toBe('0');
    fireEvent.click(roll);
    fireEvent.click(roll);
    await waitFor(() => expect(respond).toHaveBeenCalledTimes(1));
    expect(respond).toHaveBeenCalledWith('s1', expect.objectContaining({ nodeId: 'gate', version: '1', answer: { kind: 'roll' }, answerRequestId: expect.any(String) }), expect.anything());
    const next = await screen.findByRole('button', { name: 'Continue adventure' });
    expect(screen.getByText('A gentle miss.')).toBeTruthy();
    expect(document.activeElement).toBe(next);
    fireEvent.click(next);
    await waitFor(() => expect(respond).toHaveBeenCalledTimes(2));
    expect(respond).toHaveBeenLastCalledWith('s1', expect.objectContaining({ nodeId: 'gate', version: '2', answer: { kind: 'continue' } }), expect.anything());
  });
  const inspectParts = [
    { id: 'sender', role: 'sender' as const, text: 'coinz4u.example' },
    { id: 'link', role: 'link' as const, text: 'Enter a password' },
    { id: 'price', role: 'price' as const, text: 'R9.99' },
  ];

  it('submits inspect marks only on Done in open mode', async () => {
    const step: Step = { ...first, node: { ...first.node, lines: [], interaction: { type: 'inspect', document: { kind: 'message', title: 'Offer', parts: inspectParts }, minMarks: 2 } } };
    const respond = vi.fn().mockResolvedValue(second);
    const engine: Engine = { startSession: vi.fn().mockResolvedValue(step), resumeSession: vi.fn(), respond };
    render(<Player engine={engine} startRequest={{ activityId: 'story', players: [] }} />);
    const done = await screen.findByRole('button', { name: 'Done' });
    expect(done.hasAttribute('disabled')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Mark price: R9.99' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mark link: Enter a password' }));
    expect(respond).not.toHaveBeenCalled();
    fireEvent.click(done);
    await waitFor(() => expect(respond).toHaveBeenCalledWith('s1', expect.objectContaining({ answer: { kind: 'inspect', partIds: ['link', 'price'] } }), expect.anything()));
  });

  it('keeps wrong inspect practice local and uses shared feedback and reveal', async () => {
    const step: Step = { ...first, node: { ...first.node, lines: [], interaction: { type: 'inspect', document: { kind: 'message', title: 'Offer', parts: inspectParts }, local: { flagged: ['link'], feedback: { hint: { text: 'Look at what they ask for.' }, revealAfter: 1 } } } } };
    const respond = vi.fn().mockResolvedValue(second);
    const engine: Engine = { startSession: vi.fn().mockResolvedValue(step), resumeSession: vi.fn(), respond };
    render(<Player engine={engine} startRequest={{ activityId: 'story', players: [] }} />);
    await screen.findByRole('button', { name: 'Mark sender: coinz4u.example' });
    fireEvent.click(screen.getByRole('button', { name: 'Mark sender: coinz4u.example' }));
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.getByText('Look at what they ask for.')).toBeTruthy();
    expect(screen.getByText(/Look again at Enter a password/)).toBeTruthy();
    expect(respond).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Mark sender: coinz4u.example' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mark link: Enter a password' }));
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(respond).toHaveBeenCalledWith('s1', expect.objectContaining({ answer: { kind: 'inspect', partIds: ['link'] }, wrongTries: 1 }), expect.anything()));
  });

  it('confirms an explicit empty inspect check response', async () => {
    const step: Step = { ...first, node: { ...first.node, type: 'check', task: undefined, question: { text: 'What looks wrong?' }, attempt: 1, scored: true, lines: [], interaction: { type: 'inspect', document: { kind: 'sign', title: 'Notice', parts: inspectParts }, minMarks: 0 } } };
    const respond = vi.fn().mockResolvedValue(second);
    const engine: Engine = { startSession: vi.fn().mockResolvedValue(step), resumeSession: vi.fn(), respond };
    render(<Player engine={engine} startRequest={{ activityId: 'story', players: [] }} />);
    const confirm = await screen.findByRole('button', { name: "That's my answer" });
    expect(confirm.hasAttribute('disabled')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Nothing is wrong' }));
    expect(respond).not.toHaveBeenCalled();
    expect(confirm.hasAttribute('disabled')).toBe(false);
    fireEvent.click(confirm);
    await waitFor(() => expect(respond).toHaveBeenCalledWith('s1', expect.objectContaining({ answer: { kind: 'inspect', partIds: [] } }), expect.anything()));
  });
  const sequenceItems = [{ id: 'ear', label: 'Someone told me' }, { id: 'eye', label: 'I saw it' }, { id: 'book', label: 'I read it' }];

  it('places sequence items in Engine order, supports Undo, and submits only after Done in open mode', async () => {
    const sequence: Step = { ...first, node: { ...first.node, lines: [], interaction: { type: 'sequence', items: sequenceItems } } };
    const respond = vi.fn().mockResolvedValue(second);
    const engine: Engine = { startSession: vi.fn().mockResolvedValue(sequence), resumeSession: vi.fn(), respond };
    render(<Player engine={engine} startRequest={{ activityId: 'story', players: [] }} />);
    const remaining = await screen.findByRole('list', { name: 'Remaining items' });
    expect(remaining.textContent).toContain('Someone told me');
    expect(remaining.textContent?.indexOf('Someone told me')).toBeLessThan(remaining.textContent!.indexOf('I saw it'));
    const done = screen.getByRole('button', { name: 'Done' });
    expect(done.hasAttribute('disabled')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Place Someone told me' }));
    expect(screen.getByRole('status').textContent).toContain('placed at position 1');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Place I saw it' }));
    fireEvent.click(screen.getByRole('button', { name: 'Place I saw it' }));
    fireEvent.click(screen.getByRole('button', { name: 'Undo last item' }));
    expect(screen.getByRole('list', { name: 'Your order' }).textContent).toBe('Someone told me');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Place I saw it' }));
    fireEvent.click(screen.getByRole('button', { name: 'Place I saw it' }));
    fireEvent.click(screen.getByRole('button', { name: 'Place I read it' }));
    expect(respond).not.toHaveBeenCalled();
    fireEvent.click(done);
    await waitFor(() => expect(respond).toHaveBeenCalledWith('s1', expect.objectContaining({ answer: { kind: 'sequence', itemIds: ['ear', 'eye', 'book'] } }), expect.anything()));
  });

  it('uses shared practice feedback and reveal before accepting the correct sequence', async () => {
    const sequence: Step = { ...first, node: { ...first.node, lines: [], interaction: { type: 'sequence', items: sequenceItems, local: { order: ['eye', 'book', 'ear'], feedback: { hint: { text: 'Start with what you saw.' }, revealAfter: 1 } } } } };
    const respond = vi.fn().mockResolvedValue(second);
    const engine: Engine = { startSession: vi.fn().mockResolvedValue(sequence), resumeSession: vi.fn(), respond };
    render(<Player engine={engine} startRequest={{ activityId: 'story', players: [] }} />);
    await screen.findByRole('button', { name: 'Place Someone told me' });
    for (const label of ['Someone told me', 'I saw it', 'I read it']) fireEvent.click(screen.getByRole('button', { name: `Place ${label}` }));
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.getByText('Start with what you saw.')).toBeTruthy();
    expect(screen.getByText(/Look at I saw it/)).toBeTruthy();
    expect(respond).not.toHaveBeenCalled();
    for (let index = 0; index < 3; index += 1) fireEvent.click(screen.getByRole('button', { name: 'Undo last item' }));
    for (const label of ['I saw it', 'I read it', 'Someone told me']) fireEvent.click(screen.getByRole('button', { name: `Place ${label}` }));
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(respond).toHaveBeenCalledWith('s1', expect.objectContaining({ answer: { kind: 'sequence', itemIds: ['eye', 'book', 'ear'] }, wrongTries: 1 }), expect.anything()));
  });

  it('keeps a completed check sequence local until explicit confirmation', async () => {
    const check: Step = { ...first, node: { ...first.node, type: 'check', task: undefined, question: { text: 'Put these in order' }, attempt: 1, scored: true, interaction: { type: 'sequence', items: sequenceItems } } };
    const respond = vi.fn().mockResolvedValue(second);
    const engine: Engine = { startSession: vi.fn().mockResolvedValue(check), resumeSession: vi.fn(), respond };
    render(<Player engine={engine} startRequest={{ activityId: 'story', players: [] }} />);
    const confirm = await screen.findByRole('button', { name: "That's my answer" });
    expect(confirm.hasAttribute('disabled')).toBe(true);
    for (const label of ['I saw it', 'I read it', 'Someone told me']) fireEvent.click(screen.getByRole('button', { name: `Place ${label}` }));
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(respond).not.toHaveBeenCalled();
    expect(confirm.hasAttribute('disabled')).toBe(false);
    fireEvent.click(confirm);
    await waitFor(() => expect(respond).toHaveBeenCalledWith('s1', expect.objectContaining({ answer: { kind: 'sequence', itemIds: ['eye', 'book', 'ear'] } }), expect.anything()));
  });

  it('keeps wrong practice choices local and submits the correct ID with wrongTries after the explanation', async () => {
    const practice: Step = { ...first, node: { ...first.node, lines: [], autoAdvance: true, interaction: { type: 'choices', options: [{ id: 'yes', label: 'The video' }, { id: 'no', label: 'A friend' }], local: { correctId: 'yes', outcomes: {
      no: { onWrong: { text: 'Kai heard a video.' } },
      yes: { onCorrect: { image: { imageUrl: '/truth.webp', alt: 'Kai points at a video' }, line: { text: 'The video made the claim.' } } },
    } } } } };
    const respond = vi.fn().mockResolvedValue(second);
    const engine: Engine = { startSession: vi.fn().mockResolvedValue(practice), resumeSession: vi.fn(), respond };
    render(<Player engine={engine} startRequest={{ activityId: 'story', players: [] }} />);
    await screen.findByRole('button', { name: 'A friend' });
    fireEvent.click(screen.getByRole('button', { name: /Narration/ }));
    fireEvent.click(screen.getByRole('button', { name: 'A friend' }));
    expect(screen.getByText('Kai heard a video.')).toBeTruthy();
    expect(respond).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'The video' }));
    expect(screen.getByRole('img', { name: 'Kai points at a video' })).toBeTruthy();
    expect(screen.getByText('The video made the claim.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(respond).toHaveBeenCalledWith('s1', expect.objectContaining({ answer: { kind: 'choice', choiceId: 'yes' }, wrongTries: 1 }), expect.anything()));
  });

  it('requires confirmation on checks and reuses the request ID after a failed submission', async () => {
    const check: Step = { ...first, node: { ...first.node, type: 'check', task: undefined, question: { text: 'Who said it?' }, attempt: 1, scored: true, interaction: { type: 'choices', options: [{ id: 'yes', label: 'The video' }, { id: 'no', label: 'A friend' }] } } };
    const respond = vi.fn().mockRejectedValueOnce(new Error('Network interruption')).mockResolvedValueOnce(second);
    const engine: Engine = { startSession: vi.fn().mockResolvedValue(check), resumeSession: vi.fn(), respond };
    render(<Player engine={engine} startRequest={{ activityId: 'story', players: [] }} />);
    const confirm = await screen.findByRole('button', { name: "That's my answer" });
    expect(confirm.hasAttribute('disabled')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'The video' }));
    expect(respond).not.toHaveBeenCalled();
    fireEvent.click(confirm);
    await screen.findByText('Network interruption');
    fireEvent.click(confirm);
    await waitFor(() => expect(respond).toHaveBeenCalledTimes(2));
    expect(respond.mock.calls[0]?.[1].answerRequestId).toBe(respond.mock.calls[1]?.[1].answerRequestId);
  });

  it('renders accessible hotspot targets without marking a wrong location', async () => {
    const hotspot: Step = { ...first, node: { ...first.node, lines: [], interaction: { type: 'hotspots', spots: [
      { id: 'crow', label: 'The crow', region: { shape: 'rect', x: .7, y: .1, w: .15, h: .2 } },
      { id: 'dog', label: 'The dog', region: { shape: 'rect', x: .1, y: .6, w: .2, h: .25 } },
    ], local: { correctId: 'crow', feedback: { revealAfter: 1 } } } } };
    const respond = vi.fn().mockResolvedValue(second);
    const engine: Engine = { startSession: vi.fn().mockResolvedValue(hotspot), resumeSession: vi.fn(), respond };
    render(<Player engine={engine} startRequest={{ activityId: 'story', players: [] }} />);
    fireEvent.click(await screen.findByRole('button', { name: 'The dog' }));
    expect(await screen.findByText('Not yet. Try again.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'The crow' }).getAttribute('class')).toContain('revealed');
    expect(screen.getByRole('button', { name: 'The dog' }).getAttribute('class')).not.toContain('revealed');
    expect(respond).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'The crow' }));
    await waitFor(() => expect(respond).toHaveBeenCalledWith('s1', expect.objectContaining({ answer: { kind: 'hotspot', hotspotId: 'crow' }, wrongTries: 1 }), expect.anything()));
  });

  it('shows an authored hotspot reveal in place before submitting the correct answer', async () => {
    const hotspot: Step = { ...first, node: { ...first.node, lines: [], interaction: { type: 'hotspots', spots: [
      { id: 'crow', label: 'The crow', region: { shape: 'rect', x: .7, y: .1, w: .15, h: .2 }, reveal: { text: 'The crow was right there!' } },
      { id: 'dog', label: 'The dog', region: { shape: 'rect', x: .1, y: .6, w: .2, h: .25 } },
    ], local: { correctId: 'crow' } } } };
    const respond = vi.fn().mockResolvedValue(second);
    const engine: Engine = { startSession: vi.fn().mockResolvedValue(hotspot), resumeSession: vi.fn(), respond };
    render(<Player engine={engine} startRequest={{ activityId: 'story', players: [] }} />);
    fireEvent.click(await screen.findByRole('button', { name: 'The crow' }));
    expect(screen.getByRole('status').textContent).toContain('The crow was right there!');
    expect(respond).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(respond).toHaveBeenCalledWith('s1', expect.objectContaining({ answer: { kind: 'hotspot', hotspotId: 'crow' }, wrongTries: 0 }), expect.anything()));
  });

  it('renders the authored result scene, first-try score, and key before replay', async () => {
    const result: Step = { ...first, progress: { done: 2, total: 2 }, node: { ...first.node, type: 'result', id: 'gate_opens', title: 'The gate opens', lines: [{ speakerId: 'narrator', text: 'The truthful pumpkin opens the gate.' }], correctFirstTry: 1, total: 1, key: { label: 'The pumpkin key', iconUrl: '/key.webp' } } };
    const engine: Engine = { startSession: vi.fn().mockResolvedValue(result), resumeSession: vi.fn(), respond: vi.fn() };
    render(<Player engine={engine} startRequest={{ activityId: 'story', players: [] }} />);
    await screen.findByRole('heading', { name: 'The gate opens' });
    expect(screen.getByText('The truthful pumpkin opens the gate.')).toBeTruthy();
    expect(screen.getByText('1 of 1 correct on the first try')).toBeTruthy();
    expect(screen.getByText('The pumpkin key')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Play again' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull();
  });

  it('offers an explicit audio skip for a stalled correct-choice explanation', async () => {
    vi.stubGlobal('Audio', class {
      onended?: () => void;
      onerror?: () => void;
      play() { return new Promise<void>(() => { /* stalled media */ }); }
      pause() { /* cancelled on skip */ }
    });
    const practice: Step = { ...first, node: { ...first.node, lines: [], autoAdvance: true, interaction: { type: 'choices', options: [{ id: 'yes', label: 'Yes' }, { id: 'no', label: 'No' }], local: { correctId: 'yes', outcomes: { yes: { onCorrect: { line: { text: 'Here is why.', audioUrl: '/why.mp3' } } } } } } } };
    const respond = vi.fn().mockResolvedValue(second);
    const engine: Engine = { startSession: vi.fn().mockResolvedValue(practice), resumeSession: vi.fn(), respond };
    render(<Player engine={engine} startRequest={{ activityId: 'story', players: [] }} initialGesture />);
    fireEvent.click(await screen.findByRole('button', { name: 'Yes' }));
    expect(screen.getByText('Here is why.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Next' }).hasAttribute('disabled')).toBe(true);
    expect(respond).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Continue without audio' }));
    expect(screen.getByRole('button', { name: 'Next' }).hasAttribute('disabled')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(respond).toHaveBeenCalledTimes(1));
  });

  it('keeps a correct-choice explanation silent and ready when the host mutes playback', async () => {
    const audio = vi.fn();
    const speak = vi.fn();
    vi.stubGlobal('Audio', audio);
    vi.stubGlobal('speechSynthesis', { speak, cancel: vi.fn() });
    const practice: Step = { ...first, node: { ...first.node, lines: [], interaction: { type: 'choices', options: [{ id: 'yes', label: 'Yes' }, { id: 'no', label: 'No' }], local: { correctId: 'yes', outcomes: { yes: { onCorrect: { line: { text: 'Here is why.', audioUrl: '/why.mp3' } } } } } } } };
    const respond = vi.fn().mockResolvedValue(second);
    const engine: Engine = { startSession: vi.fn().mockResolvedValue(practice), resumeSession: vi.fn(), respond };
    render(<Player engine={engine} startRequest={{ activityId: 'story', players: [] }} initialGesture muted />);
    fireEvent.click(await screen.findByRole('button', { name: 'Yes' }));
    expect(await screen.findByText('Here is why.')).toBeTruthy();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Next' }).hasAttribute('disabled')).toBe(false));
    expect(audio).not.toHaveBeenCalled();
    expect(speak).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(respond).toHaveBeenCalledTimes(1));
  });

  it('allows Next when explanation audio fails and speech is unavailable', async () => {
    vi.stubGlobal('speechSynthesis', undefined);
    vi.stubGlobal('SpeechSynthesisUtterance', undefined);
    vi.stubGlobal('Audio', class {
      onended?: () => void;
      onerror?: () => void;
      play() { return Promise.reject(new Error('audio failed')); }
      pause() { /* unavailable media */ }
    });
    const practice: Step = { ...first, node: { ...first.node, lines: [], interaction: { type: 'choices', options: [{ id: 'yes', label: 'Yes' }, { id: 'no', label: 'No' }], local: { correctId: 'yes', outcomes: { yes: { onCorrect: { line: { text: 'Read this explanation.', audioUrl: '/bad.mp3' } } } } } } } };
    const respond = vi.fn().mockResolvedValue(second);
    const engine: Engine = { startSession: vi.fn().mockResolvedValue(practice), resumeSession: vi.fn(), respond };
    render(<Player engine={engine} startRequest={{ activityId: 'story', players: [] }} initialGesture />);
    fireEvent.click(await screen.findByRole('button', { name: 'Yes' }));
    expect(await screen.findByText('Read this explanation.')).toBeTruthy();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Next' }).hasAttribute('disabled')).toBe(false));
  });

  it('starts speech fallback once when audio reports both error and a rejected play promise', async () => {
    const speak = vi.fn();
    vi.stubGlobal('speechSynthesis', { speak, cancel: vi.fn() });
    vi.stubGlobal('SpeechSynthesisUtterance', class { onend?: () => void; onerror?: () => void; constructor(public text: string) {} });
    let sound: { onerror?: () => void } | undefined;
    vi.stubGlobal('Audio', class {
      onended?: () => void;
      onerror?: () => void;
      constructor() { sound = this; }
      play() { return Promise.reject(new Error('audio failed')); }
      pause() { /* unavailable media */ }
    });
    const practice: Step = { ...first, node: { ...first.node, lines: [], interaction: { type: 'choices', options: [{ id: 'yes', label: 'Yes' }], local: { correctId: 'yes', outcomes: { yes: { onCorrect: { line: { text: 'Read this explanation.', audioUrl: '/bad.mp3' } } } } } } } };
    const engine: Engine = { startSession: vi.fn().mockResolvedValue(practice), resumeSession: vi.fn(), respond: vi.fn() };
    render(<Player engine={engine} startRequest={{ activityId: 'story', players: [] }} initialGesture />);
    fireEvent.click(await screen.findByRole('button', { name: 'Yes' }));
    sound?.onerror?.();
    await waitFor(() => expect(speak).toHaveBeenCalledTimes(1));
  });

  it('keeps scene-line navigation disabled while an explanation is held', async () => {
    vi.stubGlobal('Audio', class {
      play() { return new Promise<void>(() => { /* stalled media */ }); }
      pause() { /* cancelled on skip */ }
    });
    const practice: Step = { ...first, node: { ...first.node, lines: [{ speakerId: 'narrator', text: 'First line.' }, { speakerId: 'narrator', text: 'Second line.' }], interaction: { type: 'choices', options: [{ id: 'yes', label: 'Yes' }], local: { correctId: 'yes', outcomes: { yes: { onCorrect: { line: { text: 'Explanation.', audioUrl: '/why.mp3' } } } } } } } };
    const engine: Engine = { startSession: vi.fn().mockResolvedValue(practice), resumeSession: vi.fn(), respond: vi.fn() };
    render(<Player engine={engine} startRequest={{ activityId: 'story', players: [] }} initialGesture />);
    const nextLine = await screen.findByRole('button', { name: 'Show next line' });
    expect(nextLine.hasAttribute('disabled')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
    expect(nextLine.hasAttribute('disabled')).toBe(true);
  });

  it('advances immediately on a correct practice choice without an authored outcome', async () => {
    const practice: Step = { ...first, node: { ...first.node, lines: [], interaction: { type: 'choices', options: [{ id: 'yes', label: 'Yes' }, { id: 'no', label: 'No' }], local: { correctId: 'yes' } } } };
    const respond = vi.fn().mockResolvedValue(second);
    const engine: Engine = { startSession: vi.fn().mockResolvedValue(practice), resumeSession: vi.fn(), respond };
    render(<Player engine={engine} startRequest={{ activityId: 'story', players: [] }} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Yes' }));
    await waitFor(() => expect(respond).toHaveBeenCalledWith('s1', expect.objectContaining({ answer: { kind: 'choice', choiceId: 'yes' }, wrongTries: 0 }), expect.anything()));
  });
  it('renders a scene from Engine data and submits Next and Back with the current version', async () => {
    const respond = vi.fn().mockResolvedValueOnce(second).mockResolvedValueOnce(first);
    const engine: Engine = { startSession: vi.fn().mockResolvedValue(first), resumeSession: vi.fn(), respond };
    render(<Player engine={engine} startRequest={{ activityId: 'story', players: [] }} notesEnabled isDemoMode />);
    expect(await screen.findByRole('heading', { name: 'At the gate' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'A friendly gate' })).toBeTruthy();
    expect(screen.getByText('Look at the gate.')).toBeTruthy();
    expect(screen.getByText('A clue')).toBeTruthy();
    expect(screen.getByText('A different way in.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'In the hall' })).toBeTruthy());
    expect(respond).toHaveBeenNthCalledWith(1, 's1', expect.objectContaining({ version: '1', nodeId: 'gate', answer: { kind: 'continue' } }), expect.objectContaining({ signal: expect.any(AbortSignal) }));
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'At the gate' })).toBeTruthy());
    expect(respond).toHaveBeenNthCalledWith(2, 's1', expect.objectContaining({ version: '2', nodeId: 'hall', answer: { kind: 'back' } }), expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it('keeps grown-up notes hidden outside demo mode', async () => {
    const engine: Engine = { startSession: vi.fn().mockResolvedValue(first), resumeSession: vi.fn(), respond: vi.fn() };
    render(<Player engine={engine} startRequest={{ activityId: 'story', players: [] }} notesEnabled />);
    await screen.findByRole('heading', { name: 'At the gate' });
    expect(screen.queryByText('A different way in.')).toBeNull();
  });

  it('keeps the session when a host replaces its onStep callback', async () => {
    const startRequest = { activityId: 'story', players: [] };
    const startSession = vi.fn().mockResolvedValue(first);
    const respond = vi.fn().mockResolvedValue(second);
    const firstCallback = vi.fn();
    const nextCallback = vi.fn();
    const engine: Engine = { startSession, resumeSession: vi.fn(), respond };
    const view = render(<Player engine={engine} startRequest={startRequest} onStep={firstCallback} />);
    await screen.findByRole('heading', { name: 'At the gate' });
    view.rerender(<Player engine={engine} startRequest={startRequest} onStep={nextCallback} />);
    expect(startSession).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: 'In the hall' });
    expect(firstCallback).toHaveBeenCalledTimes(1);
    expect(nextCallback).toHaveBeenCalledWith(second);
    expect(startSession).toHaveBeenCalledTimes(1);
  });

  it('ignores a response from a previous session after the player switches stories', async () => {
    let finishResponse!: (step: Step) => void;
    const oldEngine: Engine = {
      startSession: vi.fn().mockResolvedValue(first), resumeSession: vi.fn(),
      respond: vi.fn().mockImplementation(() => new Promise<Step>((resolve) => { finishResponse = resolve; })),
    };
    const replacement: Step = { ...first, sessionId: 's2', node: { ...first.node, id: 'new', title: 'New story' } };
    const newEngine: Engine = { startSession: vi.fn().mockResolvedValue(replacement), resumeSession: vi.fn(), respond: vi.fn() };
    const onStep = vi.fn();
    const { rerender } = render(<Player engine={oldEngine} startRequest={{ activityId: 'old', players: [] }} onStep={onStep} />);
    await screen.findByRole('heading', { name: 'At the gate' });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    rerender(<Player engine={newEngine} startRequest={{ activityId: 'new', players: [] }} onStep={onStep} />);
    await screen.findByRole('heading', { name: 'New story' });
    finishResponse(second);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'New story' })).toBeTruthy());
    expect(onStep).toHaveBeenCalledTimes(2);
  });

  it('keeps navigation live when a media control is used during a pending response', async () => {
    let finishResponse!: (step: Step) => void;
    const engine: Engine = {
      startSession: vi.fn().mockResolvedValue(first), resumeSession: vi.fn(),
      respond: vi.fn().mockImplementation(() => new Promise<Step>((resolve) => { finishResponse = resolve; })),
    };
    render(<Player engine={engine} startRequest={{ activityId: 'story', players: [] }} />);
    await screen.findByRole('heading', { name: 'At the gate' });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Replay line' }));
    finishResponse(second);
    await screen.findByRole('heading', { name: 'In the hall' });
    expect(screen.getByRole('button', { name: 'Next' }).hasAttribute('disabled')).toBe(false);
  });

  it('does not restart ongoing narration when the first gesture arrives', async () => {
    const played: Array<{ onended?: () => void }> = [];
    vi.stubGlobal('Audio', class {
      onended?: () => void;
      onerror?: () => void;
      constructor(_url: string) { played.push(this); }
      play() { return Promise.resolve(); }
      pause() { /* stopped between lines */ }
    });
    const narrated: Step = { ...first, node: { ...first.node, lines: [
      { speakerId: 'narrator', text: 'First.', audioUrl: '/first.mp3' },
      { speakerId: 'narrator', text: 'Second.', audioUrl: '/second.mp3' },
    ] } };
    const engine: Engine = { startSession: vi.fn().mockResolvedValue(narrated), resumeSession: vi.fn(), respond: vi.fn() };
    render(<Player engine={engine} startRequest={{ activityId: 'story', players: [] }} />);
    await screen.findByRole('heading', { name: 'At the gate' });
    await waitFor(() => expect(played).toHaveLength(1));
    act(() => played[0]!.onended?.());
    expect(screen.getByText('Second.')).toBeTruthy();
    expect(played).toHaveLength(2);
    fireEvent.pointerDown(screen.getByRole('region', { name: 'Story player' }));
    expect(played).toHaveLength(2);
    expect(screen.getByText('Second.')).toBeTruthy();
  });

  it('starts young-child narration once after the first gesture', async () => {
    const played: string[] = [];
    vi.stubGlobal('Audio', class {
      constructor(url: string) { played.push(url); }
      play() { return Promise.resolve(); }
      pause() { /* stopped on cleanup */ }
    });
    const young: Step = { ...first, ageGroupId: '3-5', node: { ...first.node, lines: [{ speakerId: 'narrator', text: 'Welcome.', audioUrl: '/welcome.mp3' }] } };
    const engine: Engine = { startSession: vi.fn().mockResolvedValue(young), resumeSession: vi.fn(), respond: vi.fn() };
    render(<Player engine={engine} startRequest={{ activityId: 'story', players: [] }} />);
    await screen.findByRole('heading', { name: 'At the gate' });
    expect(played).toHaveLength(0);
    fireEvent.pointerDown(screen.getByRole('region', { name: 'Story player' }));
    await waitFor(() => expect(played).toEqual(['/welcome.mp3']));
    fireEvent.keyDown(screen.getByRole('region', { name: 'Story player' }));
    expect(played).toHaveLength(1);
  });

  it('does not speak a cancelled audio fallback after unmount', async () => {
    let rejectPlay!: (error: Error) => void;
    const speak = vi.fn();
    vi.stubGlobal('speechSynthesis', { speak, cancel: vi.fn() });
    vi.stubGlobal('SpeechSynthesisUtterance', class { constructor(_text: string) {} });
    vi.stubGlobal('Audio', class {
      play() { return new Promise<void>((_resolve, reject) => { rejectPlay = reject; }); }
      pause() { /* stopped on unmount */ }
    });
    const narrated: Step = { ...first, node: { ...first.node, lines: [{ speakerId: 'narrator', text: 'Welcome.', audioUrl: '/welcome.mp3' }] } };
    const engine: Engine = { startSession: vi.fn().mockResolvedValue(narrated), resumeSession: vi.fn(), respond: vi.fn() };
    const view = render(<Player engine={engine} startRequest={{ activityId: 'story', players: [] }} initialGesture />);
    await screen.findByRole('heading', { name: 'At the gate' });
    await waitFor(() => expect(rejectPlay).toBeTypeOf('function'));
    view.unmount();
    rejectPlay(new Error('Playback cancelled'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(speak).not.toHaveBeenCalled();
  });

  it('aborts an in-flight Engine request on unmount', async () => {
    const respond = vi.fn().mockImplementation(() => new Promise<Step>(() => { /* pending transport */ }));
    const engine: Engine = { startSession: vi.fn().mockResolvedValue(first), resumeSession: vi.fn(), respond };
    const view = render(<Player engine={engine} startRequest={{ activityId: 'story', players: [] }} />);
    await screen.findByRole('heading', { name: 'At the gate' });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    const options = respond.mock.calls[0]?.[2] as { signal: AbortSignal };
    expect(options.signal.aborted).toBe(false);
    view.unmount();
    expect(options.signal.aborted).toBe(true);
  });

  it('stops video when the player unmounts', async () => {
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    const withVideo: Step = { ...first, node: { ...first.node, media: { video: { url: '/gate.mp4', onEnd: 'stop', skippable: true } } } };
    const engine: Engine = { startSession: vi.fn().mockResolvedValue(withVideo), resumeSession: vi.fn(), respond: vi.fn() };
    const view = render(<Player engine={engine} startRequest={{ activityId: 'story', players: [] }} />);
    await screen.findByRole('heading', { name: 'At the gate' });
    view.unmount();
    expect(pause).toHaveBeenCalled();
    pause.mockRestore();
  });

  it('keeps video playback separate from line narration', async () => {
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    const withVideo: Step = { ...first, node: { ...first.node, media: { video: { url: '/gate.mp4', onEnd: 'stop', skippable: true } }, lines: [{ speakerId: 'narrator', text: 'Spoken in the video.', audioUrl: '/duplicate.mp3' }] } };
    const engine: Engine = { startSession: vi.fn().mockResolvedValue(withVideo), resumeSession: vi.fn(), respond: vi.fn() };
    render(<Player engine={engine} startRequest={{ activityId: 'story', players: [] }} />);
    expect(await screen.findByText('Spoken in the video.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Skip video' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Replay line' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Narration/ })).toBeNull();
    expect(pause).not.toHaveBeenCalled();
  });

  it.each([
    ['1-2', '64px', 'true'],
    ['6-9', '48px', 'true'],
    ['13-18', '44px', 'false'],
  ] as const)('sets age %s density and narration defaults', async (ageGroupId, target, pressed) => {
    const aged: Step = { ...first, ageGroupId };
    const engine: Engine = { startSession: vi.fn().mockResolvedValue(aged), resumeSession: vi.fn(), respond: vi.fn() };
    render(<Player engine={engine} startRequest={{ activityId: 'story', players: [] }} />);
    await screen.findByRole('heading', { name: 'At the gate' });
    expect(screen.getByRole('region', { name: 'Story player' }).getAttribute('style')).toContain(`--mp-min-target: ${target}`);
    expect(screen.getByRole('button', { name: /Narration/ }).getAttribute('aria-pressed')).toBe(pressed);
  });

  it('keeps the end view usable when restarting the story fails', async () => {
    const ended: Step = { ...first, progress: { done: 2, total: 2 }, node: { ...first.node, type: 'result', id: 'story-end', title: 'The End', correctFirstTry: 0, total: 0 } };
    const engine: Engine = {
      startSession: vi.fn().mockResolvedValueOnce(ended).mockRejectedValueOnce(new Error('Story unavailable')),
      resumeSession: vi.fn(), respond: vi.fn(),
    };
    render(<Player engine={engine} startRequest={{ activityId: 'story', players: [] }} />);
    await screen.findByRole('heading', { name: 'The End' });
    fireEvent.click(screen.getByRole('button', { name: 'Play again' }));
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Story unavailable');
    expect(screen.getByRole('button', { name: 'Play again' }).hasAttribute('disabled')).toBe(false);
  });

  it('allows a trusted host to show grown-up notes', async () => {
    const engine: Engine = { startSession: vi.fn().mockResolvedValue(first), resumeSession: vi.fn(), respond: vi.fn() };
    render(<Player engine={engine} startRequest={{ activityId: 'story', players: [] }} notesEnabled grownUpAuthorized />);
    await screen.findByRole('heading', { name: 'At the gate' });
    expect(screen.getByText('A different way in.')).toBeTruthy();
  });

  it('auto-advances only after recorded narration completes and keeps Next available', async () => {
    const played: Array<{ onended?: () => void; pause: ReturnType<typeof vi.fn> }> = [];
    vi.stubGlobal('Audio', class {
      onended?: () => void;
      onerror?: () => void;
      pause = vi.fn();
      constructor(_url: string) { played.push(this); }
      play() { return Promise.resolve(); }
    });
    const narrated: Step = { ...first, node: { ...first.node, autoAdvance: true, lines: [{ speakerId: 'narrator', text: 'Welcome.', audioUrl: '/welcome.mp3' }] } };
    const respond = vi.fn().mockResolvedValue(second);
    const engine: Engine = { startSession: vi.fn().mockResolvedValue(narrated), resumeSession: vi.fn(), respond };
    render(<Player engine={engine} startRequest={{ activityId: 'story', players: [] }} initialGesture />);
    await screen.findByRole('heading', { name: 'At the gate' });
    await waitFor(() => expect(played).toHaveLength(1));
    expect(screen.getByRole('button', { name: 'Next' })).toBeTruthy();
    expect(respond).not.toHaveBeenCalled();
    played[0]!.onended?.();
    await waitFor(() => expect(respond).toHaveBeenCalledWith('s1', expect.objectContaining({ answer: { kind: 'continue' } }), expect.objectContaining({ signal: expect.any(AbortSignal) })));
    expect(played[0]!.pause).toHaveBeenCalled();
  });

  it('waits for Next when auto-advance has no playable audio', async () => {
    vi.stubGlobal('speechSynthesis', undefined);
    vi.stubGlobal('SpeechSynthesisUtterance', undefined);
    const silent: Step = { ...first, node: { ...first.node, autoAdvance: true } };
    const respond = vi.fn();
    const engine: Engine = { startSession: vi.fn().mockResolvedValue(silent), resumeSession: vi.fn(), respond };
    render(<Player engine={engine} startRequest={{ activityId: 'story', players: [] }} initialGesture />);
    await screen.findByRole('heading', { name: 'At the gate' });
    expect(screen.getByRole('button', { name: 'Next' })).toBeTruthy();
    expect(respond).not.toHaveBeenCalled();
  });

  it.each([
    ['disabled', { type: 'continue' as const }, false],
    ['a non-continue interaction', { type: 'choices' as const, options: [{ id: 'yes', label: 'Yes' }] }, true],
  ])('does not auto-advance with %s', async (_case, interaction, autoAdvance) => {
    const played: Array<{ onended?: () => void }> = [];
    vi.stubGlobal('Audio', class {
      onended?: () => void;
      onerror?: () => void;
      constructor(_url: string) { played.push(this); }
      play() { return Promise.resolve(); }
      pause() { /* playback cleanup */ }
    });
    const node: Step = { ...first, node: { ...first.node, interaction, autoAdvance, lines: [{ speakerId: 'narrator', text: 'Welcome.', audioUrl: '/welcome.mp3' }] } };
    const respond = vi.fn();
    const engine: Engine = { startSession: vi.fn().mockResolvedValue(node), resumeSession: vi.fn(), respond };
    render(<Player engine={engine} startRequest={{ activityId: 'story', players: [] }} initialGesture />);
    await screen.findByRole('heading', { name: 'At the gate' });
    await waitFor(() => expect(played).toHaveLength(1));
    played[0]!.onended?.();
    expect(respond).not.toHaveBeenCalled();
  });
});
