"use client";

import { FirebaseError } from "firebase/app";
import { FormEvent, useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth, type AuthModalMode } from "@/context/auth-context.shared";
import Button from "@/components/ui/Button";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { cn } from "@/lib/cn";

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
      case "auth/unauthorized-domain":
        return "This domain is not authorized in Firebase. Add your site URL under Firebase Console → Authentication → Settings → Authorized domains.";
      case "auth/operation-not-allowed":
        return "Google sign-in is not enabled in Firebase. Enable it under Authentication → Sign-in method.";
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

function AuthModeToggle({
  mode,
  onChange,
}: {
  mode: AuthModalMode;
  onChange: (mode: AuthModalMode) => void;
}) {
  return (
    <div className="relative grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-zinc-900/80 p-1 shadow-inner shadow-black/30">
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-y-1 w-[calc(50%-0.25rem)] rounded-xl bg-gradient-to-b from-violet-500 to-violet-600 shadow-md shadow-violet-950/40 transition-all duration-300 ease-out",
          mode === "signin" ? "left-1" : "left-[calc(50%+0.125rem)]",
        )}
      />
      {(["signin", "signup"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "relative z-10 min-h-11 rounded-xl px-3 text-sm font-semibold transition-colors duration-200",
            mode === option ? "text-white" : "text-zinc-400 hover:text-zinc-200",
          )}
        >
          {option === "signin" ? "Sign In" : "Sign Up"}
        </button>
      ))}
    </div>
  );
}

function FieldIcon({ children }: { children: ReactNode }) {
  return (
    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
      {children}
    </span>
  );
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
  const isSignIn = authModalMode === "signin";

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
      if (isSignIn) {
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

    try {
      const method = await signInWithGoogle();

      if (method === "redirect") {
        setIsRedirecting(true);
        return;
      }

      setIsSubmitting(false);
    } catch (err) {
      setIsRedirecting(false);
      setError(getAuthErrorMessage(err));
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-16 -top-20 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute -bottom-16 -right-10 h-44 w-44 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="relative z-10">
      <Button
        type="button"
        variant="iconGhost"
        onClick={onClose}
        className="absolute right-0 top-0 z-20 text-zinc-400 hover:bg-white/10 hover:text-white"
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
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </Button>

      <header className="relative mb-6 pr-10">
        <div className="relative z-10 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/30 bg-zinc-950/80 bg-gradient-to-br from-violet-500/25 to-violet-700/10 shadow-sm shadow-violet-950/20 backdrop-blur-sm">
          <svg
            className="h-6 w-6 text-violet-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
            />
          </svg>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-300/80">
          FlickFocus Account
        </p>
        <h2
          id="auth-modal-title"
          className="mt-2 bg-gradient-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-2xl font-bold tracking-tight text-transparent"
        >
          {isSignIn ? "Welcome back" : "Join the watchlist"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          {isSignIn
            ? "Sign in to sync favorites and unlock your personalized movie experience."
            : "Create an account to save films and build your cinematic collection."}
        </p>
      </header>

      <div className="relative mb-5">
        <AuthModeToggle mode={authModalMode} onChange={switchMode} />
      </div>

      {displayedError && !isRedirecting ? (
        <div
          role="alert"
          className="mb-4 flex items-start gap-3 rounded-xl border border-red-500/25 bg-red-500/10 px-3.5 py-3 text-sm text-red-200"
        >
          <svg
            className="mt-0.5 h-4 w-4 shrink-0 text-red-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m0 3.75h.007M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="min-w-0 break-words leading-relaxed">{displayedError}</p>
        </div>
      ) : null}

      <form onSubmit={handleEmailSubmit} className="relative space-y-4">
        <div>
          <label
            htmlFor="auth-email"
            className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500"
          >
            Email
          </label>
          <div className="relative">
            <FieldIcon>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </FieldIcon>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
              className="auth-field"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="auth-password"
            className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500"
          >
            Password
          </label>
          <div className="relative">
            <FieldIcon>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75M4.5 10.5h15a1.125 1.125 0 011.125 1.125v7.125A1.125 1.125 0 0119.5 20.25h-15A1.125 1.125 0 013.375 19.125V11.625A1.125 1.125 0 014.5 10.5z" />
              </svg>
            </FieldIcon>
            <input
              id="auth-password"
              type="password"
              autoComplete={isSignIn ? "current-password" : "new-password"}
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
              className="auth-field"
              placeholder="At least 6 characters"
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="violet"
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting
            ? "Please wait..."
            : isSignIn
              ? "Sign In"
              : "Create Account"}
        </Button>
      </form>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-zinc-950 px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
            or continue with google
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="google"
        onClick={handleGoogleSignIn}
        disabled={isSubmitting}
        className="w-full"
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
      </Button>

      {isRedirecting ? (
        <p className="mt-3 text-center text-xs text-zinc-500">Redirecting to Google…</p>
      ) : null}
      </div>
    </div>
  );
}

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal } = useAuth();
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, isAuthModalOpen);

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
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6"
      role="presentation"
      onClick={closeAuthModal}
    >
      <div
        className="auth-modal-backdrop absolute inset-0 bg-black/75 backdrop-blur-md"
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="auth-modal-enter relative z-10 max-h-[min(92dvh,calc(100dvh-2rem))] w-full max-w-[440px] overflow-y-auto overscroll-contain rounded-3xl border border-white/10 bg-zinc-950/95 p-5 shadow-2xl shadow-black/50 ring-1 ring-white/10 backdrop-blur-xl sm:max-h-[min(90dvh,calc(100dvh-3rem))] sm:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <AuthModalForm onClose={closeAuthModal} />
      </div>
    </div>
  );
}
