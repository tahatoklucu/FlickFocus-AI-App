import { FirebaseError } from "firebase/app";
import {
  getRedirectResult,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  type Auth,
  type UserCredential,
} from "firebase/auth";

export type GoogleSignInMethod = "popup" | "redirect";

const REDIRECT_PENDING_KEY = "flickfocus.googleRedirectPending";

let redirectResultPromise: Promise<UserCredential | null> | null = null;

function createGoogleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

function isBenignRedirectError(error: unknown): boolean {
  return (
    error instanceof FirebaseError &&
    (error.code === "auth/argument-error" ||
      error.code === "auth/no-auth-event")
  );
}

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

/**
 * Completes a Google redirect sign-in when returning to the app.
 * Safe to call on every page load — benign errors resolve to null.
 */
export function completeGoogleRedirectSignIn(
  auth: Auth,
): Promise<UserCredential | null> {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  redirectResultPromise ??= getRedirectResult(auth)
    .catch((error) => {
      redirectResultPromise = null;

      if (isBenignRedirectError(error)) {
        clearGoogleRedirectPending();
        return null;
      }

      throw error;
    })
    .finally(() => {
      clearGoogleRedirectPending();
    });

  return redirectResultPromise;
}

/**
 * Prefer popup (fast, stays on page). Fall back to redirect when popup fails.
 */
export async function signInWithGoogle(
  auth: Auth,
): Promise<GoogleSignInMethod> {
  const provider = createGoogleProvider();

  try {
    await signInWithPopup(auth, provider);
    return "popup";
  } catch (error) {
    if (
      error instanceof FirebaseError &&
      (error.code === "auth/popup-blocked" ||
        error.code === "auth/argument-error")
    ) {
      markGoogleRedirectPending();
      await signInWithRedirect(auth, createGoogleProvider());
      return "redirect";
    }

    throw error;
  }
}

export function getGoogleAuthErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/unauthorized-domain":
        return "This domain is not authorized in Firebase. Add your site URL (e.g. flickfocus.vercel.app or localhost) under Firebase Console → Authentication → Settings → Authorized domains.";
      case "auth/operation-not-allowed":
        return "Google sign-in is not enabled in Firebase. Turn it on under Authentication → Sign-in method.";
      case "auth/account-exists-with-different-credential":
        return "An account already exists with this email using a different sign-in method.";
      case "auth/popup-closed-by-user":
      case "auth/cancelled-popup-request":
      case "auth/redirect-cancelled-by-user":
        return "Google sign-in was cancelled.";
      case "auth/popup-blocked":
        return "Google sign-in was blocked by the browser. Redirecting to Google instead.";
      case "auth/argument-error":
        return "Google sign-in could not start in this browser. Retrying with redirect.";
      case "auth/network-request-failed":
        return "Network error during Google sign-in. Check your connection and try again.";
      default:
        return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Google sign-in failed. Please try again.";
}
