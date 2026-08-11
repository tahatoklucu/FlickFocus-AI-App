const REDIRECT_PENDING_KEY = "flickfocus.googleRedirectPending";
const OPEN_AUTH_MODAL_KEY = "flickfocus.pendingAuthModal";

export function markGoogleRedirectPending() {
  sessionStorage.setItem(REDIRECT_PENDING_KEY, "1");
}

export function clearGoogleRedirectPending() {
  sessionStorage.removeItem(REDIRECT_PENDING_KEY);
}

export function isGoogleRedirectPending(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return sessionStorage.getItem(REDIRECT_PENDING_KEY) === "1";
}

export function markPendingAuthModal(mode: "signin" | "signup" = "signin") {
  sessionStorage.setItem(OPEN_AUTH_MODAL_KEY, mode);
}

export function consumePendingAuthModal(): "signin" | "signup" | null {
  if (typeof window === "undefined") {
    return null;
  }

  const mode = sessionStorage.getItem(OPEN_AUTH_MODAL_KEY);
  sessionStorage.removeItem(OPEN_AUTH_MODAL_KEY);
  return mode === "signup" ? "signup" : mode === "signin" ? "signin" : null;
}
