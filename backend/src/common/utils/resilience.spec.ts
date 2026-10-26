import { describe, it, expect, vi } from 'vitest';
import { withRetry } from './resilience';

describe('withRetry resilience utility', () => {
  it('should return result immediately on successful execution without retries', async () => {
    const fn = vi.fn().mockResolvedValue('success-payload');

    const result = await withRetry(fn, { retries: 3, initialDelayMs: 1 });

    expect(result).toBe('success-payload');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on transient failures and return result upon eventual success', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('Transient network timeout'))
      .mockResolvedValueOnce('eventual-success');

    const result = await withRetry(fn, { retries: 3, initialDelayMs: 1, factor: 1 });

    expect(result).toBe('eventual-success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should propagate the error after exhausting all retry attempts', async () => {
    const networkError = new Error('Persistent Gateway 504 Timeout');
    const fn = vi.fn().mockRejectedValue(networkError);

    await expect(
      withRetry(fn, { retries: 2, initialDelayMs: 1, factor: 1 }),
    ).rejects.toThrow('Persistent Gateway 504 Timeout');

    // 1 initial attempt + 2 retries = 3 calls
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
