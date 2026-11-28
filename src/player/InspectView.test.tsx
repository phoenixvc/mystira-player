import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { InspectView } from './InspectView';

afterEach(cleanup);

const inspectDocument = { kind: 'message' as const, title: 'A fictional offer', parts: [
  { id: 'sender', role: 'sender' as const, text: 'coinz4u.example' },
  { id: 'link', role: 'link' as const, text: 'Visit coinz4u.example' },
  { id: 'button', role: 'button' as const, text: 'Claim coins' },
] };

describe('InspectView', () => {
  it('toggles parts, announces counts, keeps focus, and renders document links inert', () => {
    const done = vi.fn();
    render(<InspectView document={inspectDocument} minMarks={2} disabled={false} onEdit={() => {}} onDone={done} />);
    const sender = screen.getByRole('button', { name: 'Mark sender: coinz4u.example' });
    sender.focus();
    fireEvent.click(sender);
    expect(sender.getAttribute('aria-pressed')).toBe('true');
    expect(document.activeElement).toBe(sender);
    expect(screen.getByRole('status').textContent).toContain('1 of at least 2 marked');
    expect(screen.getByRole('button', { name: 'Done' }).hasAttribute('disabled')).toBe(true);
    fireEvent.click(sender);
    expect(sender.getAttribute('aria-pressed')).toBe('false');
    expect(done).not.toHaveBeenCalled();
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Claim coins' })).toBeNull();
  });

  it('submits each selected subset only on Done and in document order', () => {
    for (let mask = 1; mask < 8; mask += 1) {
      const done = vi.fn();
      const { unmount } = render(<InspectView document={inspectDocument} minMarks={1} disabled={false} onEdit={() => {}} onDone={done} />);
      for (let index = 2; index >= 0; index -= 1) if (mask & (1 << index)) fireEvent.click(screen.getByRole('button', { name: `Mark ${inspectDocument.parts[index]!.role}: ${inspectDocument.parts[index]!.text}` }));
      expect(done).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole('button', { name: 'Done' }));
      expect(done).toHaveBeenCalledOnce();
      expect(done).toHaveBeenCalledWith(inspectDocument.parts.filter((_, index) => mask & (1 << index)).map((part) => part.id));
      unmount();
    }
  });

  it('offers explicit empty selection only when minimum marks is zero', () => {
    const done = vi.fn();
    render(<InspectView document={inspectDocument} minMarks={0} disabled={false} onEdit={() => {}} onDone={done} />);
    expect(done).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Mark sender: coinz4u.example' }));
    expect(screen.getByRole('button', { name: 'Mark sender: coinz4u.example' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Nothing is wrong' }));
    expect(done).toHaveBeenCalledWith([]);
    expect(screen.getByRole('button', { name: 'Mark sender: coinz4u.example' }).getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByRole('status').textContent).toContain('No parts marked');
  });
});
