import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, waitFor } from '@testing-library/react';
import { defineMystiraPlayer, type MystiraPlayerElement } from './mystira-player';
import type { Engine, Step } from '../engine/types';

defineMystiraPlayer();
afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });

const first: Step = {
  sessionId: 'session-1', version: '1', ageGroupId: '6-9', players: [],
  node: { type: 'scene', id: 'door', title: 'The door', media: {}, characters: [], speakers: [], lines: [], overlays: [], interaction: { type: 'continue' }, music: { profile: 'quiet' }, exitAllowed: false },
};
const end: Step = { ...first, version: '2', node: { ...first.node, type: 'result', id: 'result', title: 'Done', correctFirstTry: 0, total: 0 } };

function makeEngine(): Engine {
  return { startSession: vi.fn().mockResolvedValue(first), resumeSession: vi.fn().mockResolvedValue(first), respond: vi.fn().mockResolvedValue(end) };
}

describe('mystira-player host element', () => {
  it('notifies the host when a generic story ending is resumed', async () => {
    const terminal: Step = { ...first, node: { ...first.node, type: 'terminal', id: 'story-end', interaction: { type: 'terminal' } } };
    const engine: Engine = { startSession: vi.fn(), resumeSession: vi.fn().mockResolvedValue(terminal), respond: vi.fn() };
    const element = document.createElement('mystira-player') as MystiraPlayerElement;
    element.engine = engine;
    element.muted = true;
    const complete = vi.fn();
    element.addEventListener('mp-complete', complete);
    document.body.append(element);
    element.resume('session-1');
    await waitFor(() => expect(complete).toHaveBeenCalledTimes(1));
    expect((complete.mock.calls[0]![0] as CustomEvent).detail).toEqual({ sessionId: 'session-1' });
    expect(element.shadowRoot?.querySelector('button')).toBeNull();
  });
  it('renders in a shadow root and emits only sanitized composed lifecycle events', async () => {
    const engine = makeEngine();
    const element = document.createElement('mystira-player') as MystiraPlayerElement;
    const events: Record<string, unknown>[] = [];
    for (const name of ['mp-ready', 'mp-node-enter', 'mp-answer', 'mp-complete']) {
      document.addEventListener(name, (event) => events.push({ name, detail: (event as CustomEvent).detail }), { once: true });
    }
    element.engine = engine;
    element.setAttribute('theme', 'mystira-light');
    element.innerHTML = '<span slot="end-cta">Host next step</span>';
    document.body.append(element);
    element.start({ activityId: 'lesson', players: [{ type: 'Guest', displayName: 'Demo' }] });
    const shadow = element.shadowRoot!;
    expect(shadow.querySelector('style')?.textContent).toContain(':host([theme="mystira-light"])');
    await waitFor(() => expect(shadow.querySelector('h1')?.textContent).toBe('The door'));
    await act(async () => { element.setAttribute('theme', 'mystira-dark'); element.muted = true; });
    expect(engine.startSession).toHaveBeenCalledTimes(1);
    expect(events.find((event) => event.name === 'mp-node-enter')?.detail).toEqual({ sessionId: 'session-1', nodeId: 'door', nodeType: 'scene', music: 'quiet', exitAllowed: false });
    fireEvent.click(shadow.querySelector('button:last-of-type')!);
    await waitFor(() => expect(shadow.querySelector('h1')?.textContent).toBe('Done'));
    expect(events.find((event) => event.name === 'mp-answer')?.detail).toEqual({ sessionId: 'session-1', nodeId: 'door', answerKind: 'continue' });
    expect(events.find((event) => event.name === 'mp-complete')?.detail).toEqual({ sessionId: 'session-1' });
    expect(element.hasAttribute('data-complete')).toBe(true);
    expect(shadow.querySelector('slot[name="end-cta"]')).not.toBeNull();
    expect(JSON.stringify(events)).not.toContain('Demo');
  });

  it('resumes through the host engine and unmounts cleanly', async () => {
    const engine = makeEngine();
    const element = document.createElement('mystira-player') as MystiraPlayerElement;
    element.engine = engine;
    element.muted = true;
    document.body.append(element);
    element.resume('session-1');
    await waitFor(() => expect(element.shadowRoot?.querySelector('h1')?.textContent).toBe('The door'));
    expect(engine.resumeSession).toHaveBeenCalledWith('session-1', expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(engine.startSession).not.toHaveBeenCalled();
    element.remove();
    expect(element.shadowRoot?.querySelector('[part="player"]')?.childElementCount).toBe(0);
  });
});
