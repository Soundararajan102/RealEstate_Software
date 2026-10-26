export interface RetryOptions {
  retries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  factor?: number;
  onRetry?: (error: unknown, attempt: number) => void;
}

/**
 * Executes an async operation with exponential backoff retry.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const retries = options.retries ?? 3;
  const initialDelayMs = options.initialDelayMs ?? 200;
  const maxDelayMs = options.maxDelayMs ?? 2000;
  const factor = options.factor ?? 2;

  let attempt = 0;
  let delay = initialDelayMs;

  while (attempt <= retries) {
    try {
      return await operation();
    } catch (error) {
      attempt++;
      if (attempt > retries) {
        throw error;
      }

      if (options.onRetry) {
        options.onRetry(error, attempt);
      }

      // Add small random jitter (±20%) to prevent thundering herd
      const jitter = delay * (0.8 + Math.random() * 0.4);
      await new Promise((resolve) => setTimeout(resolve, Math.min(jitter, maxDelayMs)));

      delay *= factor;
    }
  }

  throw new Error('Unreachable state in withRetry');
}
