import { FirebaseError } from "firebase/app";
import {
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  type Auth,
  type UserCredential,
} from "firebase/auth";
import { googleProvider } from "@/lib/firebase";

export type GoogleSignInMethod = "popup" | "redirect";

const REDIRECT_PENDING_KEY = "flickfocus.googleRedirectPending";

let redirectResultPromise: Promise<UserCredential | null> | null = null;

export function markGoogleRedirectPending() {
  sessionStorage.setItem(REDIRECT_PENDING_KEY, "1");
}

export function clearGoogleRedirectPending() {
  sessionStorage.removeItem(REDIRECT_PENDING_KEY);
}

export function isGoogleRedirectPending(): boolean {
  return sessionStorage.getItem(REDIRECT_PENDING_KEY) === "1";
}

/**
 * Must run once on every full page load after Google redirect.
 * Cached for React Strict Mode remounts on the same navigation.
 */
export function completeGoogleRedirectSignIn(
  auth: Auth,
): Promise<UserCredential | null> {
  redirectResultPromise ??= getRedirectResult(auth)
    .catch((error) => {
      redirectResultPromise = null;
      throw error;
    })
    .finally(() => {
      clearGoogleRedirectPending();
    });

  return redirectResultPromise;
}

/**
 * Prefer popup (fast, stays on page). Fall back to redirect when blocked.
 */
export async function signInWithGoogle(
  auth: Auth,
): Promise<GoogleSignInMethod> {
  try {
    await signInWithPopup(auth, googleProvider);
    return "popup";
  } catch (error) {
    if (
      error instanceof FirebaseError &&
      error.code === "auth/popup-blocked"
    ) {
      markGoogleRedirectPending();
      await signInWithRedirect(auth, googleProvider);
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
