import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Player } from './Player';
import type { Engine, Step } from '../engine/types';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

const first: Step = {
  sessionId: 's1', version: '1', ageGroupId: '6-9', players: [], canGoBack: false,
  progress: { done: 0, total: 2 },
  node: { type: 'scene', id: 'gate', title: 'At the gate', media: { imageUrl: '/gate.webp', alt: 'A friendly gate' }, characters: [], speakers: [], lines: [{ speakerId: 'narrator', text: 'Welcome.' }], task: { text: 'Look at the gate.' }, overlays: [{ id: 'note', text: 'A clue', anchor: { x: 0.5, y: 0.5 }, align: 'center', style: 'callout' }], rationale: { differs: true, text: 'A different way in.' }, interaction: { type: 'continue' } },
};
const second: Step = { ...first, version: '2', canGoBack: true, progress: { done: 1, total: 2 }, node: { ...first.node, id: 'hall', title: 'In the hall' } };

describe('Player', () => {
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
    const ended: Step = { ...first, progress: { done: 2, total: 2 }, node: { ...first.node, type: 'result', id: 'story-end', correctFirstTry: 0, total: 0 } };
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
