import { cn, formatDate } from '@/lib/utils';

describe('cn (className merge utility)', () => {
  it('merges simple class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('deduplicates conflicting Tailwind classes', () => {
    const result = cn('px-2', 'px-4');
    expect(result).toBe('px-4');
  });

  it('returns empty string for no input', () => {
    expect(cn()).toBe('');
  });

  it('handles undefined and null values', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end');
  });
});

describe('formatDate', () => {
  it('formats a valid date string', () => {
    const result = formatDate('2024-01-15');
    expect(result).toMatch(/Jan 15, 2024/);
  });

  it('formats a Date object', () => {
    const date = new Date(2024, 0, 15); // Jan 15, 2024
    const result = formatDate(date);
    expect(result).toMatch(/Jan 15, 2024/);
  });

  it('returns "N/A" for empty string', () => {
    expect(formatDate('')).toBe('N/A');
  });

  it('returns "Invalid Date" for garbage input', () => {
    expect(formatDate('not-a-date')).toBe('Invalid Date');
  });

  it('handles ISO date strings', () => {
    const result = formatDate('2023-12-25T10:30:00Z');
    expect(result).toMatch(/Dec 25, 2023/);
  });
});
