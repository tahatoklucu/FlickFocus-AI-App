import { FirebaseError } from "firebase/app";

const TRANSIENT_FIREBASE_CODES = new Set([
  "unavailable",
  "deadline-exceeded",
  "aborted",
  "resource-exhausted",
]);

export function isTransientFirebaseError(error: unknown): boolean {
  return error instanceof FirebaseError && TRANSIENT_FIREBASE_CODES.has(error.code);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function withTransientRetry<T>(
  operation: () => Promise<T>,
  options?: { maxAttempts?: number; baseDelayMs?: number },
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? 3;
  const baseDelayMs = options?.baseDelayMs ?? 700;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts || !isTransientFirebaseError(error)) {
        throw error;
      }

      await wait(baseDelayMs * attempt);
    }
  }

  throw lastError;
}
