"use client";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import {
  completeGoogleRedirectSignIn,
  getGoogleAuthErrorMessage,
  isGoogleRedirectPending,
  signInWithGoogle as startGoogleSignIn,
  type GoogleSignInMethod,
} from "@/lib/google-auth";
import {
  buildProfileFromAuth,
  ensureUserProfile,
  subscribeToUserProfile,
  updateUserProfile as persistUserProfile,
  uploadUserAvatar,
  type UpdateUserProfileInput,
} from "@/services/users";
import type { UserProfile } from "@/types/user";

export type AuthModalMode = "signin" | "signup";

interface AuthContextValue {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  redirectResolving: boolean;
  profileLoading: boolean;
  profileSyncing: boolean;
  profileError: string | null;
  isConfigured: boolean;
  isAuthModalOpen: boolean;
  authModalMode: AuthModalMode;
  openAuthModal: (mode?: AuthModalMode) => void;
  closeAuthModal: () => void;
  signInWithGoogle: () => Promise<GoogleSignInMethod>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
  clearProfileError: () => void;
  retryProfileSync: () => Promise<void>;
  updateUserProfile: (input: UpdateUserProfileInput) => Promise<UserProfile>;
  uploadProfilePhoto: (file: File) => Promise<string>;
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

function AuthInitOverlay({ message }: { message: string }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950/60 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-neutral-800 bg-neutral-900/95 px-8 py-6 shadow-2xl">
        <svg
          className="h-8 w-8 animate-spin text-white"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <p className="text-sm font-medium text-neutral-200">{message}</p>
      </div>
    </div>
  );
}

function applyAuthUser(
  firebaseUser: User,
  setUser: (user: User) => void,
  setProfileSyncState: Dispatch<SetStateAction<ProfileSyncState>>,
) {
  setUser(firebaseUser);
  setProfileSyncState({
    userId: firebaseUser.uid,
    hasReceivedProfile: true,
    profile: buildProfileFromAuth(firebaseUser),
    error: null,
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profileSyncState, setProfileSyncState] =
    useState<ProfileSyncState>(initialProfileSyncState);
  const [loading, setLoading] = useState(() => isFirebaseConfigured());
  const [redirectResolving, setRedirectResolving] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>("signin");
  const [authError, setAuthError] = useState<string | null>(null);
  const [profileSyncing, setProfileSyncing] = useState(false);
  const profileUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setLoading(false);
      return;
    }

    const auth = getFirebaseAuth();
    let isActive = true;
    let authStateReady = false;
    let redirectReady = false;

    const wasRedirectPending = isGoogleRedirectPending();

    if (wasRedirectPending) {
      setRedirectResolving(true);
    }

    function finishInitialization() {
      if (!isActive || !authStateReady || !redirectReady) {
        return;
      }

      setLoading(false);
      setRedirectResolving(false);
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!isActive) {
        return;
      }

      setUser(firebaseUser);

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

      authStateReady = true;
      finishInitialization();
    });

    if (wasRedirectPending) {
      void completeGoogleRedirectSignIn(auth)
        .then((result) => {
          if (!isActive || !result?.user) {
            return;
          }

          applyAuthUser(result.user, setUser, setProfileSyncState);
          setAuthError(null);
          setIsAuthModalOpen(false);
        })
        .catch((error: unknown) => {
          if (!isActive) {
            return;
          }

          setAuthError(getGoogleAuthErrorMessage(error));
          setAuthModalMode("signin");
          setIsAuthModalOpen(true);
        })
        .finally(() => {
          if (!isActive) {
            return;
          }

          redirectReady = true;
          finishInitialization();
        });
    } else {
      redirectReady = true;
      finishInitialization();
    }

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user || !isFirebaseConfigured()) {
      profileUnsubscribeRef.current?.();
      profileUnsubscribeRef.current = null;
      return;
    }

    const activeUser = user;
    const userId = activeUser.uid;
    let isActive = true;

    function attachProfileListener() {
      profileUnsubscribeRef.current?.();

      profileUnsubscribeRef.current = subscribeToUserProfile(
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

    async function syncProfile() {
      setProfileSyncing(true);

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
      } finally {
        if (isActive) {
          setProfileSyncing(false);
        }
      }

      if (!isActive) {
        return;
      }

      attachProfileListener();
    }

    void syncProfile();

    return () => {
      isActive = false;
      profileUnsubscribeRef.current?.();
      profileUnsubscribeRef.current = null;
    };
  }, [user]);

  const retryProfileSync = useCallback(async () => {
    if (!user || !isFirebaseConfigured() || profileSyncing) {
      return;
    }

    const activeUser = user;
    const userId = activeUser.uid;

    setProfileSyncing(true);
    setProfileSyncState((current) =>
      current.userId === userId ? { ...current, error: null } : current,
    );

    try {
      await activeUser.getIdToken();
      const profile = await ensureUserProfile(activeUser);

      setProfileSyncState({
        userId,
        hasReceivedProfile: true,
        profile,
        error: null,
      });

      profileUnsubscribeRef.current?.();
      profileUnsubscribeRef.current = subscribeToUserProfile(
        userId,
        (nextProfile) => {
          if (!nextProfile) {
            return;
          }

          setProfileSyncState({
            userId,
            hasReceivedProfile: true,
            profile: nextProfile,
            error: null,
          });
        },
        (error) => {
          setProfileSyncState((current) => ({
            userId,
            hasReceivedProfile: true,
            profile: current.profile ?? buildProfileFromAuth(activeUser),
            error: error.message,
          }));
        },
      );
    } catch (error: unknown) {
      setProfileSyncState((current) => ({
        userId,
        hasReceivedProfile: true,
        profile: current.profile ?? buildProfileFromAuth(activeUser),
        error:
          error instanceof Error
            ? error.message
            : "Failed to sync user profile.",
      }));
    } finally {
      setProfileSyncing(false);
    }
  }, [user, profileSyncing]);

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

  useEffect(() => {
    if (!user || !profileError) {
      return;
    }

    function handleOnline() {
      void retryProfileSync();
    }

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [user, profileError, retryProfileSync]);

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
    const method = await startGoogleSignIn(getFirebaseAuth());

    if (method === "popup") {
      closeAuthModal();
    }

    return method;
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

  const updateUserProfile = useCallback(
    async (input: UpdateUserProfileInput) => {
      if (!user) {
        throw new Error("You must be signed in to update your profile.");
      }

      const profile = await persistUserProfile(user, input);
      const auth = getFirebaseAuth();

      if (auth.currentUser) {
        setUser(auth.currentUser);
      }

      setProfileSyncState({
        userId: user.uid,
        hasReceivedProfile: true,
        profile,
        error: null,
      });

      return profile;
    },
    [user],
  );

  const uploadProfilePhoto = useCallback(
    async (file: File) => {
      if (!user) {
        throw new Error("You must be signed in to upload a profile photo.");
      }

      return uploadUserAvatar(user, file);
    },
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      userProfile,
      loading,
      redirectResolving,
      profileLoading,
      profileSyncing,
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
      retryProfileSync,
      updateUserProfile,
      uploadProfilePhoto,
    }),
    [
      user,
      userProfile,
      loading,
      redirectResolving,
      profileLoading,
      profileSyncing,
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
      retryProfileSync,
      updateUserProfile,
      uploadProfilePhoto,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {hasMounted && loading && isFirebaseConfigured() ? (
        <AuthInitOverlay
          message={
            redirectResolving
              ? "Completing sign-in..."
              : "Loading your account..."
          }
        />
      ) : null}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
