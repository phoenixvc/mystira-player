import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './LanguageExplorer.module.css';

type Locale = 'en' | 'af';
export type LanguagePair = {
  sceneId: string;
  lineIndex: number;
  en: { text: string; audioUrl: string; words?: { text: string; startMs: number; endMs: number }[] };
  af: { text: string; audioUrl: string; words?: { text: string; startMs: number; endMs: number }[] };
  links: { en: string; af: string }[];
};
type Props = { pair: LanguagePair; locale: Locale; muted: boolean; onExplore: () => void; registerStop?: (stop: (() => void) | undefined) => void };

function highlighted(text: string, phrase: string | undefined, activeWord: number | undefined) {
  const phraseStart = phrase ? text.toLowerCase().indexOf(phrase.toLowerCase()) : -1;
  const phraseEnd = phraseStart < 0 ? -1 : phraseStart + phrase!.length;
  let cursor = 0;
  const parts = [...text.matchAll(/\S+/gu)].map((match, index) => {
    const start = match.index;
    const end = start + match[0].length;
    const prefix = text.slice(cursor, start);
    cursor = end;
    const matched = phraseStart >= 0 && start < phraseEnd && end > phraseStart;
    return <span key={start}>{prefix}<span className={`${matched ? styles.matched : ''} ${activeWord === index ? styles.reading : ''}`}>{match[0]}</span></span>;
  });
  return <>{parts}{text.slice(cursor)}</>;
}

export function LanguageExplorer({ pair, locale, muted, onExplore, registerStop }: Props) {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState<Locale>();
  const [elapsedMs, setElapsedMs] = useState(0);
  const [selectedLink, setSelectedLink] = useState<number>();
  const audio = useRef<HTMLAudioElement | undefined>(undefined);

  const stopReplay = useCallback(() => {
    audio.current?.pause();
    audio.current = undefined;
    setPlaying(undefined);
    setElapsedMs(0);
  }, []);

  useEffect(() => {
    registerStop?.(stopReplay);
    return () => { registerStop?.(undefined); stopReplay(); };
  }, [registerStop, stopReplay]);

  function replay(language: Locale) {
    onExplore();
    stopReplay();
    if (muted) return;
    const sound = new Audio(pair[language].audioUrl);
    audio.current = sound;
    sound.onended = () => { if (audio.current === sound) setPlaying(undefined); };
    sound.onerror = () => { if (audio.current === sound) setPlaying(undefined); };
    sound.ontimeupdate = () => { if (audio.current === sound) setElapsedMs(sound.currentTime * 1000); };
    setPlaying(language);
    void sound.play().catch(() => { if (audio.current === sound) setPlaying(undefined); });
  }

  const selected = selectedLink === undefined ? undefined : pair.links[selectedLink];
  return <section className={styles.explorer} aria-label={locale === 'af' ? 'Vergelyk tale' : 'Compare languages'}>
    <button type="button" aria-expanded={open} onClick={() => { if (!open) onExplore(); setOpen((value) => !value); if (open) stopReplay(); }}>
      {locale === 'af' ? 'Vergelyk Engels en Afrikaans' : 'Compare English and Afrikaans'}
    </button>
    {open && <div className={styles.content}>
      <p className={styles.hint}>{locale === 'af' ? 'Luister na dieselfde gedagte in albei tale.' : 'Hear the same idea in both languages.'}</p>
      <div className={styles.sentences}>
        {(['en', 'af'] as const).map((language) => <div className={styles.sentence} key={language} lang={language === 'af' ? 'af-ZA' : 'en'}>
          <div className={styles.sentenceHead}><strong>{language === 'af' ? 'Afrikaans' : 'English'}</strong><button type="button" aria-label={language === 'af' ? 'Hoor Afrikaans weer' : 'Replay English'} aria-pressed={playing === language} disabled={muted} onClick={() => replay(language)}>{playing === language ? '◼' : '▶'} {language === 'af' ? 'Hoor weer' : 'Replay'}</button></div>
          <p>{highlighted(pair[language].text, selected?.[language], playing === language ? pair[language].words?.findIndex((word) => elapsedMs >= word.startMs && elapsedMs <= word.endMs) : undefined)}</p>
        </div>)}
      </div>
      {pair.links.length > 0 && <div className={styles.links}>
        <p>{locale === 'af' ? 'Tik ’n idee om te sien hoe dit vertaal.' : 'Tap an idea to see how it translates.'}</p>
        <div className={styles.linkList}>{pair.links.map((link, index) => <button type="button" key={`${link.en}:${link.af}`} aria-pressed={selectedLink === index} onClick={() => setSelectedLink((current) => current === index ? undefined : index)}>
          <span lang="en">{link.en}</span><span className={styles.srOnly}>{locale === 'af' ? ' beteken ' : ' means '}</span><span aria-hidden="true">↔</span><span lang="af-ZA">{link.af}</span>
        </button>)}</div>
      </div>}
    </div>}
  </section>;
}
