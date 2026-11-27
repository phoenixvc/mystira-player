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
    vi.mocked(loadLocalDemo).mockResolvedValue({ engine, activityId: 'demo' });

    render(React.createElement(App));
    const startButton = screen.getByRole('button', { name: 'Start preview' });
    await waitFor(() => expect(startButton.hasAttribute('disabled')).toBe(false));
    fireEvent.click(startButton);
    expect((await screen.findByRole('status')).textContent).toContain('not available in the core preview');
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull();
    expect(respond).not.toHaveBeenCalled();
  });
});
