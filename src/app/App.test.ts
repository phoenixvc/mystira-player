import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Engine, Step } from '../engine/types';
import { App } from './App';
import { loadLocalDemo } from './localDemo';

vi.mock('./localDemo', () => ({ loadLocalDemo: vi.fn() }));
afterEach(() => cleanup());

describe('core preview', () => {
  it('renders a choice scene with stable answer submission', async () => {
    const step: Step = {
      sessionId: 'session', version: '1', ageGroupId: '6-9', players: [],
      node: {
        type: 'scene', id: 'choice', title: 'Choose', media: {}, characters: [], speakers: [], lines: [], overlays: [],
        interaction: { type: 'choices', options: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }] },
      },
      progress: { done: 0, total: 2 },
    };
    const respond = vi.fn();
    const engine: Engine = {
      startSession: vi.fn().mockResolvedValue(step),
      resumeSession: vi.fn().mockResolvedValue(step),
      respond,
    };
    vi.mocked(loadLocalDemo).mockResolvedValue({ engine, activityId: 'demo', isDemoMode: true, sceneForProfile: (id) => id, piecesForProfile: () => [] });

    render(React.createElement(App));
    const startButton = screen.getByRole('button', { name: 'Start preview' });
    await waitFor(() => expect(startButton.hasAttribute('disabled')).toBe(false));
    fireEvent.click(startButton);
    await screen.findByRole('button', { name: 'A' });
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'A' }));
    await waitFor(() => expect(respond).toHaveBeenCalledWith('session', expect.objectContaining({ answer: { kind: 'choice', choiceId: 'a' } }), expect.anything()));
  });

  it('switches demo profiles at the corresponding scene supplied by the engine', async () => {
    const step: Step = {
      sessionId: 'first', version: '1', ageGroupId: '6-9', players: [],
      node: { type: 'scene', id: 'base-scene', title: 'Base scene', media: {}, characters: [], speakers: [], lines: [], overlays: [], interaction: { type: 'continue' } },
    };
    const other = { ...step, sessionId: 'second', node: { ...step.node, id: 'other-scene', title: 'Other scene' } };
    const startSession = vi.fn().mockResolvedValueOnce(step).mockResolvedValueOnce(other);
    const engine: Engine = { listProfiles: vi.fn().mockResolvedValue([{ profileId: 'a', displayName: 'A' }, { profileId: 'b', displayName: 'B' }]), startSession, resumeSession: vi.fn(), respond: vi.fn() };
    vi.mocked(loadLocalDemo).mockResolvedValue({ engine, activityId: 'demo', isDemoMode: true, sceneForProfile: (id, profileId) => id === 'base-scene' && profileId === 'b' ? 'other-scene' : undefined, piecesForProfile: () => [] });
    render(React.createElement(App));
    fireEvent.click(await screen.findByRole('button', { name: 'Start preview' }));
    await screen.findByRole('heading', { name: 'Base scene' });
    fireEvent.change(screen.getByLabelText('Child'), { target: { value: 'b' } });
    await screen.findByRole('heading', { name: 'Other scene' });
    expect(startSession).toHaveBeenLastCalledWith(expect.objectContaining({ players: [{ type: 'Profile', profileId: 'b' }], startNodeId: 'other-scene' }), expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it('keeps the selected piece across rapid profile changes while a session is pending', async () => {
    const scene = (profile: string): Step => ({
      sessionId: profile, version: '1', ageGroupId: '6-9', players: [],
      node: { type: 'scene', id: `${profile}-piece`, title: `${profile} piece`, media: {}, characters: [], speakers: [], lines: [], overlays: [], interaction: { type: 'continue' } },
    });
    const startSession = vi.fn().mockResolvedValueOnce(scene('a'))
      .mockImplementationOnce(() => new Promise<Step>(() => { /* delayed profile b */ }))
      .mockResolvedValueOnce(scene('c'));
    const engine: Engine = {
      listProfiles: vi.fn().mockResolvedValue(['a', 'b', 'c'].map((profileId) => ({ profileId, displayName: profileId }))),
      startSession, resumeSession: vi.fn(), respond: vi.fn(),
    };
    vi.mocked(loadLocalDemo).mockResolvedValue({ engine, activityId: 'demo', isDemoMode: true, sceneForProfile: (id, profileId) => id.endsWith('-piece') ? `${profileId}-piece` : undefined, piecesForProfile: () => [] });
    render(React.createElement(App));
    fireEvent.click(await screen.findByRole('button', { name: 'Start preview' }));
    await screen.findByRole('heading', { name: 'a piece' });
    fireEvent.change(screen.getByLabelText('Child'), { target: { value: 'b' } });
    fireEvent.change(screen.getByLabelText('Child'), { target: { value: 'c' } });
    await screen.findByRole('heading', { name: 'c piece' });
    expect(startSession).toHaveBeenLastCalledWith(expect.objectContaining({ startNodeId: 'c-piece' }), expect.anything());
  });

  it('keeps demo controls outside the player and toggles grown-up notes', async () => {
    const step: Step = {
      sessionId: 'session', version: '1', ageGroupId: '6-9', players: [],
      node: { type: 'scene', id: 'scene', title: 'Scene', media: {}, characters: [], speakers: [], lines: [], overlays: [], rationale: { differs: false, text: 'A note for grown-ups.' }, interaction: { type: 'continue' } },
    };
    const engine: Engine = { startSession: vi.fn().mockResolvedValue(step), resumeSession: vi.fn(), respond: vi.fn() };
    vi.mocked(loadLocalDemo).mockResolvedValue({ engine, activityId: 'demo', isDemoMode: true, sceneForProfile: (id) => id, piecesForProfile: () => [] });
    render(React.createElement(App));
    fireEvent.click(await screen.findByRole('button', { name: 'Start preview' }));
    await screen.findByRole('heading', { name: 'Scene' });
    const controls = screen.getByRole('complementary', { name: 'Demo controls' });
    expect(screen.getByRole('region', { name: 'Story player' }).contains(controls)).toBe(false);
    expect(screen.getByRole('option', { name: 'Assessment · Spec 2' }).hasAttribute('disabled')).toBe(true);
    expect(screen.queryByText('A note for grown-ups.')).toBeNull();
    fireEvent.click(screen.getByLabelText('Grown-up notes'));
    expect(screen.getByText('A note for grown-ups.')).toBeTruthy();
  });

  it('starts the Engine-provided assessment and follow-up entries', async () => {
    const check: Step = { sessionId: 'check', version: '1', ageGroupId: '6-9', players: [], node: { type: 'check', id: 'question', title: 'Question', media: {}, characters: [], speakers: [], lines: [], overlays: [], question: { text: 'Who said it?' }, attempt: 1, scored: true, interaction: { type: 'choices', options: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }] } } };
    const assessmentStart = vi.fn().mockResolvedValue(check);
    const assessmentEngine: Engine = { startSession: assessmentStart, resumeSession: vi.fn(), respond: vi.fn() };
    const engine: Engine = { startSession: vi.fn(), resumeSession: vi.fn(), respond: vi.fn() };
    vi.mocked(loadLocalDemo).mockResolvedValue({ engine, activityId: 'preview', isDemoMode: true, sceneForProfile: (id) => id, piecesForProfile: () => [], assessment: { engine: assessmentEngine, activityId: 'lesson', profiles: [{ profileId: 'child', displayName: 'Child' }], sequenceProfiles: [], entries: { assessment: 'assessment', followUp: 'follow-up' } } });
    render(React.createElement(App));
    await waitFor(() => expect(screen.getByRole('option', { name: 'Assessment · Spec 2' }).hasAttribute('disabled')).toBe(false));
    fireEvent.change(screen.getByLabelText('Entry point'), { target: { value: 'assessment' } });
    fireEvent.click(screen.getByRole('button', { name: 'Start preview' }));
    await screen.findByRole('heading', { name: 'Question' });
    expect(assessmentStart).toHaveBeenCalledWith(expect.objectContaining({ activityId: 'lesson', players: [{ type: 'Profile', profileId: 'child' }], startNodeId: 'assessment' }), expect.anything());
    fireEvent.change(screen.getByLabelText('Entry point'), { target: { value: 'follow-up' } });
    fireEvent.click(screen.getByRole('button', { name: 'Start preview' }));
    await waitFor(() => expect(assessmentStart).toHaveBeenLastCalledWith(expect.objectContaining({ startNodeId: 'follow-up' }), expect.anything()));
  });

  it('hides demo controls when the host is not in demo mode', async () => {
    const engine: Engine = { startSession: vi.fn(), resumeSession: vi.fn(), respond: vi.fn() };
    vi.mocked(loadLocalDemo).mockResolvedValue({ engine, activityId: 'demo', isDemoMode: false, sceneForProfile: () => undefined, piecesForProfile: () => [] });
    render(React.createElement(App));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Start preview' }).hasAttribute('disabled')).toBe(false));
    expect(screen.queryByRole('complementary', { name: 'Demo controls' })).toBeNull();
  });
});
