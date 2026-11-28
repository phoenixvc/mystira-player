import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { LanguageExplorer, type LanguagePair } from './LanguageExplorer';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

const pair: LanguagePair = {
  sceneId: 'spot_table_after', lineIndex: 0,
  en: { text: 'Same glow, no flame.', audioUrl: '/audio/en/test.mp3' },
  af: { text: 'Dieselfde lig, geen vlam nie.', audioUrl: '/audio/af/test.mp3', words: [
    { text: 'Dieselfde', startMs: 0, endMs: 250 },
    { text: 'lig,', startMs: 300, endMs: 600 },
    { text: 'geen', startMs: 650, endMs: 800 },
    { text: 'vlam', startMs: 850, endMs: 1000 },
    { text: 'nie.', startMs: 1050, endMs: 1250 },
  ] },
  links: [{ en: 'no flame', af: 'geen vlam nie' }],
};

it('replays a paired static clip, reveals the authored phrase link, and stops audio on close', () => {
  const pause = vi.fn();
  const play = vi.fn().mockResolvedValue(undefined);
  const created: string[] = [];
  let sound: { currentTime: number; ontimeupdate?: () => void } | undefined;
  vi.stubGlobal('Audio', class {
    constructor(public src: string) { created.push(src); sound = this; }
    currentTime = 0;
    ontimeupdate?: () => void;
    pause = pause;
    play = play;
  });
  const onExplore = vi.fn();
  render(<LanguageExplorer pair={pair} locale="af" muted={false} onExplore={onExplore} />);
  expect(screen.queryByText('Dieselfde lig, geen vlam nie.')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Vergelyk Engels en Afrikaans' }));
  expect(document.querySelector('[lang="af-ZA"] p')?.textContent).toBe('Dieselfde lig, geen vlam nie.');
  fireEvent.click(screen.getByRole('button', { name: /no flame.*geen vlam nie/i }));
  expect(document.querySelectorAll('[class*="matched"]')).toHaveLength(5);
  fireEvent.click(screen.getByRole('button', { name: 'Hoor Afrikaans weer' }));
  expect(created).toEqual(['/audio/af/test.mp3']);
  expect(play).toHaveBeenCalledOnce();
  expect(onExplore).toHaveBeenCalledTimes(2);
  act(() => { sound!.currentTime = 0.7; sound!.ontimeupdate?.(); });
  expect(document.querySelector('[lang="af-ZA"] [class*="reading"]')?.textContent).toBe('geen');
  fireEvent.click(screen.getByRole('button', { name: 'Vergelyk Engels en Afrikaans' }));
  expect(pause).toHaveBeenCalled();
});
