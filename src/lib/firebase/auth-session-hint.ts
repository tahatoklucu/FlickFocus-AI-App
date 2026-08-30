const AUTH_SESSION_HINT_KEY = "flickfocus.hasAuthSession";

/**
 * Lightweight marker telling us a signed-in session probably exists, so we can
 * decide whether to load the Firebase Auth SDK without loading it first.
 * Anonymous visitors never pay for the SDK on their initial page load.
 */
export function markAuthSessionHint(): void {
  try {
    localStorage.setItem(AUTH_SESSION_HINT_KEY, "1");
  } catch {
    // Private mode or full quota — falling back to on-demand loading is fine.
  }
}

export function clearAuthSessionHint(): void {
  try {
    localStorage.removeItem(AUTH_SESSION_HINT_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export function hasAuthSessionHint(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return localStorage.getItem(AUTH_SESSION_HINT_KEY) === "1";
  } catch {
    return false;
  }
}
