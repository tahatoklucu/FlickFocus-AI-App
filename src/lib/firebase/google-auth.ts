import type { Auth, UserCredential } from "firebase/auth";
import {
  clearGoogleRedirectPending,
  isGoogleRedirectPending,
  markGoogleRedirectPending,
} from "@/lib/firebase/google-auth-pending";

export type GoogleSignInMethod = "popup" | "redirect";

export { isGoogleRedirectPending, markGoogleRedirectPending, clearGoogleRedirectPending };

let redirectResultPromise: Promise<UserCredential | null> | null = null;

function createGoogleProvider(
  GoogleAuthProvider: typeof import("firebase/auth").GoogleAuthProvider,
) {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

async function isBenignRedirectError(error: unknown): Promise<boolean> {
  const { FirebaseError } = await import("firebase/app");
  return (
    error instanceof FirebaseError &&
    (error.code === "auth/argument-error" ||
      error.code === "auth/no-auth-event")
  );
}

/**
 * Completes a Google redirect sign-in when returning to the app.
 * Safe to call on every page load — benign errors resolve to null.
 */
export async function completeGoogleRedirectSignIn(
  auth: Auth,
): Promise<UserCredential | null> {
  if (typeof window === "undefined") {
    return null;
  }

  redirectResultPromise ??= (async () => {
    const { getRedirectResult } = await import("firebase/auth");
    return getRedirectResult(auth);
  })()
    .catch(async (error) => {
      redirectResultPromise = null;

      if (await isBenignRedirectError(error)) {
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
export async function signInWithGoogle(auth: Auth): Promise<GoogleSignInMethod> {
  const { GoogleAuthProvider, signInWithPopup, signInWithRedirect } =
    await import("firebase/auth");
  const { FirebaseError } = await import("firebase/app");
  const provider = createGoogleProvider(GoogleAuthProvider);

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
      await signInWithRedirect(auth, createGoogleProvider(GoogleAuthProvider));
      return "redirect";
    }

    throw error;
  }
}

export async function getGoogleAuthErrorMessage(error: unknown): Promise<string> {
  const { FirebaseError } = await import("firebase/app");

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
