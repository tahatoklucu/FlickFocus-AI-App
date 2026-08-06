"use client";

import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getFirebaseAuth,
  googleProvider,
  isFirebaseConfigured,
} from "@/lib/firebase";

export type AuthModalMode = "signin" | "signup";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isConfigured: boolean;
  isAuthModalOpen: boolean;
  authModalMode: AuthModalMode;
  openAuthModal: (mode?: AuthModalMode) => void;
  closeAuthModal: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>("signin");
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      return;
    }

    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      return;
    }

    let isActive = true;

    getRedirectResult(getFirebaseAuth())
      .then((result) => {
        if (!isActive) {
          return;
        }

        if (result?.user) {
          setAuthError(null);
          setIsAuthModalOpen(false);
        }
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        setAuthError(getGoogleAuthErrorMessage(error));
        setAuthModalMode("signin");
        setIsAuthModalOpen(true);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const openAuthModal = useCallback((mode: AuthModalMode = "signin") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setAuthError(null);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await signInWithRedirect(getFirebaseAuth(), googleProvider);
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      closeAuthModal();
    },
    [closeAuthModal],
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
      closeAuthModal();
    },
    [closeAuthModal],
  );

  const logout = useCallback(async () => {
    await signOut(getFirebaseAuth());
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isConfigured: isFirebaseConfigured(),
      isAuthModalOpen,
      authModalMode,
      openAuthModal,
      closeAuthModal,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      logout,
      authError,
      clearAuthError,
    }),
    [
      user,
      loading,
      isAuthModalOpen,
      authModalMode,
      openAuthModal,
      closeAuthModal,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      logout,
      authError,
      clearAuthError,
    ],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}

function getGoogleAuthErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/account-exists-with-different-credential":
        return "An account already exists with this email using a different sign-in method.";
      case "auth/popup-closed-by-user":
      case "auth/cancelled-popup-request":
      case "auth/redirect-cancelled-by-user":
        return "Google sign-in was cancelled.";
      case "auth/popup-blocked":
        return "Google sign-in was blocked. Please try again.";
      default:
        return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Google sign-in failed. Please try again.";
}
