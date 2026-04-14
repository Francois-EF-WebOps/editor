import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility', () => {
  it('merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes with clsx', () => {
    expect(cn('base', true && 'active')).toBe('base active');
  });

  it('handles object-based conditional classes', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active');
  });

  it('resolves tailwind conflicts (last wins)', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });

  it('handles mixed inputs (strings, objects, arrays)', () => {
    expect(cn('flex', ['items-center', 'justify-center'], { 'p-4': true })).toBe(
      'flex items-center justify-center p-4',
    );
  });

  it('returns empty string for no inputs', () => {
    expect(cn()).toBe('');
  });

  it('filters out falsy values except strings', () => {
    expect(cn('a', null, undefined, 0, '')).toBe('a');
  });
});
