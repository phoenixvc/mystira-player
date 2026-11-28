import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SequenceView } from './SequenceView';

afterEach(cleanup);

const items = ['a', 'b', 'c'].map((id) => ({ id, label: id.toUpperCase() }));

describe('SequenceView', () => {
  it('moves focus and announces placement and Undo for keyboard operation', () => {
    render(<SequenceView items={items} disabled={false} onEdit={() => {}} onDone={() => {}} />);
    screen.getByRole('button', { name: 'Place A' }).focus();
    fireEvent.click(screen.getByRole('button', { name: 'Place A' }));
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Place B' }));
    expect(screen.getByRole('status').textContent).toContain('A placed at position 1');
    fireEvent.click(screen.getByRole('button', { name: 'Undo last item' }));
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Place A' }));
    expect(screen.getByRole('status').textContent).toContain('A returned');
  });
  it('preserves every placement permutation and submits only on explicit Done', () => {
    for (const order of [
      ['a', 'b', 'c'], ['a', 'c', 'b'], ['b', 'a', 'c'],
      ['b', 'c', 'a'], ['c', 'a', 'b'], ['c', 'b', 'a'],
    ]) {
      const done = vi.fn();
      const { unmount } = render(<SequenceView items={items} disabled={false} onEdit={() => {}} onDone={done} />);
      for (const id of order) fireEvent.click(screen.getByRole('button', { name: `Place ${id.toUpperCase()}` }));
      expect([...screen.getByRole('list', { name: 'Your order' }).querySelectorAll('li')].map((item) => item.textContent)).toEqual(order.map((id) => id.toUpperCase()));
      expect(done).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole('button', { name: 'Done' }));
      expect(done).toHaveBeenCalledOnce();
      expect(done).toHaveBeenCalledWith(order);
      unmount();
    }
  });
});
