"use client";

import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
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
  resolveGoogleRedirectResult,
} from "@/lib/firebase";
import {
  buildProfileFromAuth,
  ensureUserProfile,
  subscribeToUserProfile,
} from "@/services/users";
import type { UserProfile } from "@/types/user";

export type AuthModalMode = "signin" | "signup";

interface AuthContextValue {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  profileError: string | null;
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
  clearProfileError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface ProfileSyncState {
  userId: string | null;
  hasReceivedProfile: boolean;
  profile: UserProfile | null;
  error: string | null;
}

const initialProfileSyncState: ProfileSyncState = {
  userId: null,
  hasReceivedProfile: false,
  profile: null,
  error: null,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profileSyncState, setProfileSyncState] =
    useState<ProfileSyncState>(initialProfileSyncState);
  const [loading, setLoading] = useState(() => isFirebaseConfigured());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>("signin");
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      return;
    }

    const auth = getFirebaseAuth();
    let isActive = true;
    let unsubscribe = () => {};

    async function initializeAuth() {
      try {
        const result = await resolveGoogleRedirectResult(auth);

        if (!isActive) {
          return;
        }

        if (result?.user) {
          setUser(result.user);
          setAuthError(null);
          setIsAuthModalOpen(false);
        }
      } catch (error: unknown) {
        if (!isActive) {
          return;
        }

        setAuthError(getGoogleAuthErrorMessage(error));
        setAuthModalMode("signin");
        setIsAuthModalOpen(true);
      }

      if (!isActive) {
        return;
      }

      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (!isActive) {
          return;
        }

        setUser(firebaseUser);
        setLoading(false);

        if (firebaseUser) {
          setProfileSyncState({
            userId: firebaseUser.uid,
            hasReceivedProfile: true,
            profile: buildProfileFromAuth(firebaseUser),
            error: null,
          });
        } else {
          setProfileSyncState(initialProfileSyncState);
        }
      });
    }

    void initializeAuth();

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user || !isFirebaseConfigured()) {
      return;
    }

    const activeUser = user;
    const userId = activeUser.uid;
    let isActive = true;
    let unsubscribeProfile = () => {};

    async function syncProfile() {
      try {
        await activeUser.getIdToken();
        if (!isActive) {
          return;
        }

        const profile = await ensureUserProfile(activeUser);
        if (!isActive) {
          return;
        }

        setProfileSyncState({
          userId,
          hasReceivedProfile: true,
          profile,
          error: null,
        });
      } catch (error: unknown) {
        if (!isActive) {
          return;
        }

        setProfileSyncState((current) => ({
          userId,
          hasReceivedProfile: true,
          profile: current.profile ?? buildProfileFromAuth(activeUser),
          error:
            error instanceof Error
              ? error.message
              : "Failed to sync user profile.",
        }));
      }

      if (!isActive) {
        return;
      }

      unsubscribeProfile = subscribeToUserProfile(
        userId,
        (profile) => {
          if (!isActive || !profile) {
            return;
          }

          setProfileSyncState({
            userId,
            hasReceivedProfile: true,
            profile,
            error: null,
          });
        },
        (error) => {
          if (!isActive) {
            return;
          }

          setProfileSyncState((current) => ({
            userId,
            hasReceivedProfile: true,
            profile: current.profile ?? buildProfileFromAuth(activeUser),
            error: error.message,
          }));
        },
      );
    }

    void syncProfile();

    return () => {
      isActive = false;
      unsubscribeProfile();
    };
  }, [user]);

  const userId = user?.uid;
  const userProfile = useMemo(() => {
    if (
      !userId ||
      profileSyncState.userId !== userId ||
      !profileSyncState.hasReceivedProfile
    ) {
      return null;
    }

    return profileSyncState.profile;
  }, [userId, profileSyncState]);

  const profileLoading = false;

  const profileError = useMemo(() => {
    if (
      !userId ||
      profileSyncState.userId !== userId ||
      !profileSyncState.hasReceivedProfile
    ) {
      return null;
    }

    return profileSyncState.error;
  }, [userId, profileSyncState]);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const clearProfileError = useCallback(() => {
    setProfileSyncState((current) =>
      current.error ? { ...current, error: null } : current,
    );
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
    const auth = getFirebaseAuth();

    try {
      await signInWithPopup(auth, googleProvider);
      closeAuthModal();
    } catch (error) {
      if (
        error instanceof FirebaseError &&
        error.code === "auth/popup-blocked"
      ) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }

      throw error;
    }
  }, [closeAuthModal]);

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
      userProfile,
      loading,
      profileLoading,
      profileError,
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
      clearProfileError,
    }),
    [
      user,
      userProfile,
      loading,
      profileLoading,
      profileError,
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
      clearProfileError,
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
