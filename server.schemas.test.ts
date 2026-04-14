import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Re-create the server-side Zod schemas for testing
const clipBodySchema = z
  .object({
    videoId: z.string().uuid('Invalid videoId'),
    start: z.number().min(0, 'Start time must be >= 0'),
    end: z.number().min(0, 'End time must be >= 0'),
  })
  .refine((d) => d.end > d.start, { message: 'End time must be greater than start time' });

const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query must not be empty').max(500),
});

describe('Zod validation schemas', () => {
  describe('clipBodySchema', () => {
    it('validates correct input', () => {
      const result = clipBodySchema.safeParse({
        videoId: '550e8400-e29b-41d4-a716-446655440000',
        start: 0,
        end: 10,
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid UUID', () => {
      const result = clipBodySchema.safeParse({
        videoId: 'not-a-uuid',
        start: 0,
        end: 10,
      });
      expect(result.success).toBe(false);
    });

    it('rejects negative start time', () => {
      const result = clipBodySchema.safeParse({
        videoId: '550e8400-e29b-41d4-a716-446655440000',
        start: -5,
        end: 10,
      });
      expect(result.success).toBe(false);
    });

    it('rejects negative end time', () => {
      const result = clipBodySchema.safeParse({
        videoId: '550e8400-e29b-41d4-a716-446655440000',
        start: 0,
        end: -1,
      });
      expect(result.success).toBe(false);
    });

    it('rejects when end <= start', () => {
      const result = clipBodySchema.safeParse({
        videoId: '550e8400-e29b-41d4-a716-446655440000',
        start: 10,
        end: 5,
      });
      expect(result.success).toBe(false);
    });

    it('rejects when end === start', () => {
      const result = clipBodySchema.safeParse({
        videoId: '550e8400-e29b-41d4-a716-446655440000',
        start: 5,
        end: 5,
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing fields', () => {
      const result = clipBodySchema.safeParse({ videoId: '550e8400-e29b-41d4-a716-446655440000' });
      expect(result.success).toBe(false);
    });
  });

  describe('searchQuerySchema', () => {
    it('validates correct input', () => {
      const result = searchQuerySchema.safeParse({ q: 'basketball' });
      expect(result.success).toBe(true);
    });

    it('rejects empty string', () => {
      const result = searchQuerySchema.safeParse({ q: '' });
      expect(result.success).toBe(false);
    });

    it('rejects query exceeding 500 chars', () => {
      const result = searchQuerySchema.safeParse({ q: 'a'.repeat(501) });
      expect(result.success).toBe(false);
    });

    it('accepts query at max length (500 chars)', () => {
      const result = searchQuerySchema.safeParse({ q: 'a'.repeat(500) });
      expect(result.success).toBe(true);
    });
  });
});
