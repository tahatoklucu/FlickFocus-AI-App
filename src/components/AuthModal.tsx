"use client";

import { FirebaseError } from "firebase/app";
import { FormEvent, useEffect, useState } from "react";
import { useAuth, type AuthModalMode } from "@/context/AuthContext";

function getAuthErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Invalid email or password.";
      case "auth/email-already-in-use":
        return "An account with this email already exists.";
      case "auth/weak-password":
        return "Password must be at least 6 characters.";
      case "auth/popup-closed-by-user":
      case "auth/redirect-cancelled-by-user":
        return "Google sign-in was cancelled before completing.";
      case "auth/popup-blocked":
        return "Google sign-in was blocked by the browser. Please try again.";
      case "auth/too-many-requests":
        return "Too many attempts. Please try again later.";
      default:
        return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

interface AuthModalFormProps {
  onClose: () => void;
}

function AuthModalForm({ onClose }: AuthModalFormProps) {
  const {
    authModalMode,
    openAuthModal,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    authError,
    clearAuthError,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const displayedError = error ?? authError;

  function switchMode(mode: AuthModalMode) {
    setError(null);
    clearAuthError();
    openAuthModal(mode);
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (authModalMode === "signin") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    clearAuthError();
    setIsSubmitting(true);
    setIsRedirecting(true);

    try {
      await signInWithGoogle();
    } catch (err) {
      setIsRedirecting(false);
      setError(getAuthErrorMessage(err));
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        aria-label="Close authentication modal"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <header className="mb-6 pr-8">
        <h2
          id="auth-modal-title"
          className="text-xl font-bold text-zinc-900 dark:text-zinc-50"
        >
          {authModalMode === "signin" ? "Sign In" : "Create Account"}
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {authModalMode === "signin"
            ? "Sign in to save and manage your favorite movies."
            : "Create an account to start building your watchlist."}
        </p>
      </header>

      <div className="mb-4 flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
        <button
          type="button"
          onClick={() => switchMode("signin")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
            authModalMode === "signin"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
              : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => switchMode("signup")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
            authModalMode === "signup"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
              : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          Sign Up
        </button>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isSubmitting}
        className="mb-4 flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {isRedirecting ? "Redirecting..." : "Continue with Google"}
      </button>

      {isRedirecting && (
        <p className="mb-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
          Redirecting to Google…
        </p>
      )}

      {displayedError && !isRedirecting && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
        >
          {displayedError}
        </p>
      )}

      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200 dark:border-zinc-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
            or
          </span>
        </div>
      </div>

      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="auth-email"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Email
          </label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isSubmitting}
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:ring-zinc-700"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="auth-password"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Password
          </label>
          <input
            id="auth-password"
            type="password"
            autoComplete={
              authModalMode === "signin" ? "current-password" : "new-password"
            }
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isSubmitting}
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:ring-zinc-700"
            placeholder="At least 6 characters"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {isSubmitting
            ? "Please wait..."
            : authModalMode === "signin"
              ? "Sign In"
              : "Create Account"}
        </button>
      </form>
    </>
  );
}

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal } = useAuth();

  useEffect(() => {
    if (!isAuthModalOpen) {
      return;
    }

    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeAuthModal();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="presentation"
      onClick={closeAuthModal}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900"
        onClick={(event) => event.stopPropagation()}
      >
        <AuthModalForm onClose={closeAuthModal} />
      </div>
    </div>
  );
}
