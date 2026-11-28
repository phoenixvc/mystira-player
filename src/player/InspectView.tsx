import { useState } from 'react';
import type { Interaction } from '../schema/interactions';
import styles from './Player.module.css';

type Inspect = Extract<Interaction, { type: 'inspect' }>;
type Props = {
  document: Inspect['document'];
  minMarks: number;
  disabled: boolean;
  revealIds?: string[];
  onEdit: () => void;
  onDone: (partIds: string[]) => void;
};

export function InspectView({ document, minMarks, disabled, revealIds = [], onEdit, onDone }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [announcement, setAnnouncement] = useState(`Mark at least ${minMarks} ${minMarks === 1 ? 'part' : 'parts'}, then choose Done.`);
  const ordered = document.parts.filter((part) => selected.includes(part.id)).map((part) => part.id);

  const toggle = (id: string) => {
    if (disabled) return;
    onEdit();
    const next = selected.includes(id) ? selected.filter((partId) => partId !== id) : [...selected, id];
    setSelected(next);
    const part = document.parts.find((candidate) => candidate.id === id)!;
    setAnnouncement(`${part.role} ${part.text} ${next.includes(id) ? 'marked' : 'unmarked'}. ${next.length} of at least ${minMarks} marked.`);
  };
  const chooseNothingWrong = () => {
    onEdit();
    setSelected([]);
    setAnnouncement('No parts marked. Nothing is wrong selected.');
    onDone([]);
  };

  return <section className={`${styles.inspect} ${styles[`inspect${document.kind}`]}`} aria-label={`Inspect ${document.kind}: ${document.title}`}>
    <header className={styles.inspectHeader}><span>{document.kind}</span><h2>{document.title}</h2></header>
    <div className={styles.inspectParts} role="group" aria-label="Document parts">
      {document.parts.map((part) => <button key={part.id} type="button" className={`${styles.inspectPart} ${styles[`inspectRole${part.role}`]} ${revealIds.includes(part.id) ? styles.revealed : ''}`} aria-label={`Mark ${part.role}: ${part.text}`} aria-pressed={selected.includes(part.id)} disabled={disabled} onClick={() => toggle(part.id)}>
        <span className={styles.inspectMark} aria-hidden="true">{selected.includes(part.id) ? '✓' : '○'}</span>
        <span className={styles.inspectPartContent}>{part.imageUrl && <img src={part.imageUrl} alt={part.alt ?? ''} />}{part.text}</span>
      </button>)}
    </div>
    <p role="status" aria-live="polite" className={styles.inspectStatus}>{announcement}</p>
    <div className={styles.actions}>
      <button type="button" disabled={disabled || ordered.length < minMarks} onClick={() => onDone(ordered)}>Done</button>
      {minMarks === 0 && <button type="button" disabled={disabled} onClick={chooseNothingWrong}>Nothing is wrong</button>}
    </div>
  </section>;
}
