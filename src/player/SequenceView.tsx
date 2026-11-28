import { useEffect, useRef, useState } from 'react';
import type { Interaction } from '../schema/interactions';
import styles from './Player.module.css';

type Sequence = Extract<Interaction, { type: 'sequence' }>;

type Props = {
  items: Sequence['items'];
  disabled: boolean;
  revealId?: string;
  onEdit: () => void;
  onDone: (itemIds: string[]) => void;
};

export function SequenceView({ items, disabled, revealId, onEdit, onDone }: Props) {
  const [placed, setPlaced] = useState<string[]>([]);
  const [announcement, setAnnouncement] = useState('Choose the first item.');
  const focusTarget = useRef<string | undefined>(undefined);
  const itemButtons = useRef(new Map<string, HTMLButtonElement>());
  const undoButton = useRef<HTMLButtonElement>(null);
  const remaining = items.filter((item) => !placed.includes(item.id));

  useEffect(() => {
    const target = focusTarget.current;
    if (!target) return;
    focusTarget.current = undefined;
    if (target === 'undo') undoButton.current?.focus();
    else itemButtons.current.get(target)?.focus();
  }, [placed]);

  const place = (id: string) => {
    if (disabled || placed.includes(id)) return;
    onEdit();
    const next = [...placed, id];
    setPlaced(next);
    setAnnouncement(`${items.find((item) => item.id === id)?.label ?? id} placed at position ${next.length}.`);
    focusTarget.current = items.find((item) => !next.includes(item.id))?.id ?? 'undo';
  };
  const undo = () => {
    if (disabled || placed.length === 0) return;
    onEdit();
    const removed = placed.at(-1)!;
    setPlaced(placed.slice(0, -1));
    setAnnouncement(`${items.find((item) => item.id === removed)?.label ?? removed} returned to remaining items.`);
    focusTarget.current = removed;
  };

  return <div className={styles.sequence} role="group" aria-label="Put the items in order">
    <div className={styles.sequenceColumns}>
      <div><h2>Your order</h2><ol aria-label="Your order">{placed.map((id) => {
        const item = items.find((candidate) => candidate.id === id)!;
        return <li key={id} className={revealId === id ? styles.revealed : undefined}>{item.label}</li>;
      })}</ol>{placed.length === 0 && <p>No items placed yet.</p>}</div>
      <div><h2>Remaining items</h2><ul aria-label="Remaining items">{remaining.map((item) => <li key={item.id}><button type="button" ref={(element) => { if (element) itemButtons.current.set(item.id, element); else itemButtons.current.delete(item.id); }} disabled={disabled} onClick={() => place(item.id)} aria-label={`Place ${item.label}`}>{item.imageUrl && <img src={item.imageUrl} alt={item.alt ?? ''} />}{item.label}</button></li>)}</ul>{remaining.length === 0 && <p>All items placed. Choose Done when ready.</p>}</div>
    </div>
    <p className={styles.sequenceStatus} role="status" aria-live="polite">{announcement}</p>
    <div className={styles.actions}>
      <button type="button" ref={undoButton} disabled={disabled || placed.length === 0} onClick={undo}>Undo last item</button>
      <button type="button" disabled={disabled || placed.length !== items.length} onClick={() => onDone([...placed])}>Done</button>
    </div>
  </div>;
}
