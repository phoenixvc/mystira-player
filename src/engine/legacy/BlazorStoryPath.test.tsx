import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Player } from '../../player/Player';
import { BlazorInteropEngine } from './BlazorInteropEngine';

afterEach(cleanup);

const scene = (id: string, version: string, interaction: object) => ({
  sessionId: 'fictional-session', version, ageGroupId: '6-9', players: [], canGoBack: false,
  node: { id, type: 'scene', title: id, media: { imageUrl: '/fictional-scene.png', alt: 'A cozy potion room' }, characters: [], speakers: [], lines: [], overlays: [], interaction },
});

it('replays a fictional choice, host roll, resolved result and continued scene through .NET interop', async () => {
  const choice = scene('fuzzy-leaf', '1', { type: 'choices', options: [{ id: 'tickle', label: 'Tickle her nose' }, { id: 'fan', label: 'Wave the leaf' }] });
  const ready = scene('big-sniff', '2', { type: 'roll', state: 'ready', target: 3 });
  const resolved = scene('big-sniff', '3', { type: 'roll', state: 'resolved', target: 3, result: { value: 2, success: false, message: 'The jar wobbles.' } });
  const next = scene('jar-safe', '4', { type: 'continue' });
  const invokeMethodAsync = vi.fn(async (method: string, ...args: unknown[]) => {
    if (method === 'PlayerResumeSession') return { step: choice };
    const submission = args[1] as { version: string; answer: { kind: string } };
    if (submission.version === '1' && submission.answer.kind === 'choice') return { step: ready };
    if (submission.version === '2' && submission.answer.kind === 'roll') return { step: resolved };
    if (submission.version === '3' && submission.answer.kind === 'continue') return { step: next };
    throw new Error('Unexpected host call');
  });
  render(<Player engine={new BlazorInteropEngine({ invokeMethodAsync })} resumeSessionId="fictional-session" muted />);
  fireEvent.click(await screen.findByRole('button', { name: 'Tickle her nose' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Roll' }));
  expect(await screen.findByText('The jar wobbles.')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Continue adventure' }));
  await waitFor(() => expect(screen.getByRole('heading', { name: 'jar-safe' })).toBeTruthy());
  expect(invokeMethodAsync.mock.calls.map((call) => call[0])).toEqual(['PlayerResumeSession', 'PlayerRespond', 'PlayerRespond', 'PlayerRespond']);
});
