import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Engine, Step } from '../engine/types';
import { App } from './App';
import { loadLocalDemo } from './localDemo';

vi.mock('./localDemo', () => ({ loadLocalDemo: vi.fn() }));
afterEach(() => cleanup());

describe('core preview', () => {
  it('does not offer Next for a scene whose interaction is not rendered yet', async () => {
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
    vi.mocked(loadLocalDemo).mockResolvedValue({ engine, activityId: 'demo', isDemoMode: true, sceneForProfile: (id) => id });

    render(React.createElement(App));
    const startButton = screen.getByRole('button', { name: 'Start preview' });
    await waitFor(() => expect(startButton.hasAttribute('disabled')).toBe(false));
    fireEvent.click(startButton);
    await waitFor(() => expect(screen.getByText('This interaction is not available in the core preview yet.')).toBeTruthy());
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull();
    expect(respond).not.toHaveBeenCalled();
  });

  it('switches demo profiles at the corresponding scene supplied by the engine', async () => {
    const step: Step = {
      sessionId: 'first', version: '1', ageGroupId: '6-9', players: [],
      node: { type: 'scene', id: 'base-scene', title: 'Base scene', media: {}, characters: [], speakers: [], lines: [], overlays: [], interaction: { type: 'continue' } },
    };
    const other = { ...step, sessionId: 'second', node: { ...step.node, id: 'other-scene', title: 'Other scene' } };
    const startSession = vi.fn().mockResolvedValueOnce(step).mockResolvedValueOnce(other);
    const engine: Engine = { listProfiles: vi.fn().mockResolvedValue([{ profileId: 'a', displayName: 'A' }, { profileId: 'b', displayName: 'B' }]), startSession, resumeSession: vi.fn(), respond: vi.fn() };
    vi.mocked(loadLocalDemo).mockResolvedValue({ engine, activityId: 'demo', isDemoMode: true, sceneForProfile: (id, profileId) => id === 'base-scene' && profileId === 'b' ? 'other-scene' : undefined });
    render(React.createElement(App));
    fireEvent.click(await screen.findByRole('button', { name: 'Start preview' }));
    await screen.findByRole('heading', { name: 'Base scene' });
    fireEvent.change(screen.getByLabelText('Child'), { target: { value: 'b' } });
    await screen.findByRole('heading', { name: 'Other scene' });
    expect(startSession).toHaveBeenLastCalledWith(expect.objectContaining({ players: [{ type: 'Profile', profileId: 'b' }], startNodeId: 'other-scene' }));
  });
});
