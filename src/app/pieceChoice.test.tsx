import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from './App';
import { loadLocalDemo } from './localDemo';
import type { Engine, Step } from '../engine/types';

vi.mock('./localDemo', () => ({ loadLocalDemo: vi.fn() }));
afterEach(() => cleanup());

describe('child-chosen lesson order', () => {
  it('offers engine-selected piece starts and lets the child choose either piece first', async () => {
    const piece = (id: string): Step => ({
      sessionId: id, version: '1', ageGroupId: '6-9', players: [],
      node: { type: 'scene', id, title: id, media: {}, characters: [], speakers: [], lines: [], overlays: [], interaction: { type: 'continue' } },
    });
    const startSession = vi.fn().mockImplementation(async (request: { startNodeId?: string }) => piece(request.startNodeId ?? 'unexpected'));
    const engine: Engine = {
      listProfiles: vi.fn().mockResolvedValue([{ profileId: 'chooser', displayName: 'Chooser' }]),
      startSession, resumeSession: vi.fn(), respond: vi.fn(),
    };
    vi.mocked(loadLocalDemo).mockResolvedValue({
      engine, activityId: 'lesson', isDemoMode: true,
      sceneForProfile: (id) => id,
      piecesForProfile: () => [
        { id: 'first', title: 'First piece', startSceneId: 'first-scene' },
        { id: 'second', title: 'Second piece', startSceneId: 'second-scene' },
      ],
    });
    render(<App />);
    await screen.findByRole('button', { name: 'Second piece' });
    expect(screen.getByRole('button', { name: 'Start preview' }).hasAttribute('disabled')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Second piece' }));
    await screen.findByRole('heading', { name: 'second-scene' });
    expect(startSession).toHaveBeenLastCalledWith(expect.objectContaining({ startNodeId: 'second-scene' }), expect.any(Object));
    fireEvent.click(screen.getByRole('button', { name: 'First piece' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'first-scene' })).toBeTruthy());
    expect(startSession).toHaveBeenLastCalledWith(expect.objectContaining({ startNodeId: 'first-scene' }), expect.any(Object));
  });
});
