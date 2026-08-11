"use client";

import type { User } from "firebase/auth";
import {
  useSyncExternalStore,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  AuthContext,
  type AuthContextValue,
  type AuthModalMode,
} from "@/context/auth-context.shared";
import {
  ensureFirebaseAuth,
  ensureFirebaseDb,
  getFirebaseAuth,
  isFirebaseConfigured,
} from "@/lib/firebase";
import { consumePendingAuthModal } from "@/lib/firebase/google-auth-pending";
import { readProfileCache } from "@/lib/profile/profile-cache";
import type { UserProfile } from "@/types/user";

export type { AuthModalMode } from "@/context/auth-context.shared";
export { useAuth } from "@/context/auth-context.shared";

interface ProfileSyncState {
  userId: string | null;
  hasReceivedProfile: boolean;
  profile: UserProfile | null;
  error: string | null;
  cloudSyncOffline: boolean;
}

const initialProfileSyncState: ProfileSyncState = {
  userId: null,
  hasReceivedProfile: false,
  profile: null,
  error: null,
  cloudSyncOffline: false,
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
  buildProfileFromAuth: (user: User) => UserProfile,
) {
  setUser(firebaseUser);
  setProfileSyncState({
    userId: firebaseUser.uid,
    hasReceivedProfile: true,
    profile:
      readProfileCache(firebaseUser.uid) ?? buildProfileFromAuth(firebaseUser),
    error: null,
    cloudSyncOffline: false,
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profileSyncState, setProfileSyncState] =
    useState<ProfileSyncState>(initialProfileSyncState);
  const [loading, setLoading] = useState(() => isFirebaseConfigured());
  const [redirectResolving, setRedirectResolving] = useState(false);
  const hasMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>("signin");
  const [authError, setAuthError] = useState<string | null>(null);
  const [profileSyncing, setProfileSyncing] = useState(false);
  const profileUnsubscribeRef = useRef<(() => void) | null>(null);
  const authUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      return;
    }

    let isActive = true;

    void (async () => {
      const [
        { onAuthStateChanged },
        auth,
        { isGoogleRedirectPending, completeGoogleRedirectSignIn, getGoogleAuthErrorMessage },
        { buildProfileFromAuth },
      ] = await Promise.all([
        import("firebase/auth"),
        ensureFirebaseAuth(),
        import("@/lib/firebase/google-auth"),
        import("@/services/users"),
      ]);

      await ensureFirebaseDb();

      if (!isActive) {
        return;
      }

      let authStateReady = false;
      let redirectReady = false;
      const wasRedirectPending = isGoogleRedirectPending();

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
            profile:
              readProfileCache(firebaseUser.uid) ??
              buildProfileFromAuth(firebaseUser),
            error: null,
            cloudSyncOffline: false,
          });
        } else {
          setProfileSyncState(initialProfileSyncState);
        }

        authStateReady = true;
        finishInitialization();
      });

      if (wasRedirectPending) {
        setRedirectResolving(true);
        void completeGoogleRedirectSignIn(auth)
          .then((result) => {
            if (!isActive || !result?.user) {
              return;
            }

            applyAuthUser(result.user, setUser, setProfileSyncState, buildProfileFromAuth);
            setAuthError(null);
            setIsAuthModalOpen(false);
          })
          .catch((error: unknown) => {
            if (!isActive) {
              return;
            }

            void getGoogleAuthErrorMessage(error).then((message) => {
              if (!isActive) {
                return;
              }

              setAuthError(message);
              setAuthModalMode("signin");
              setIsAuthModalOpen(true);
            });
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

      const pendingModal = consumePendingAuthModal();
      if (pendingModal) {
        setAuthModalMode(pendingModal);
        setIsAuthModalOpen(true);
      }

      authUnsubscribeRef.current = unsubscribe;
    })();

    return () => {
      isActive = false;
      authUnsubscribeRef.current?.();
      authUnsubscribeRef.current = null;
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

    void (async () => {
      const {
        buildProfileFromAuth,
        ensureUserProfile,
        subscribeToUserProfile,
      } = await import("@/services/users");

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
              cloudSyncOffline: false,
            });
          },
          () => {
            if (!isActive) {
              return;
            }

            setProfileSyncState((current) => ({
              userId,
              hasReceivedProfile: true,
              profile:
                current.profile ??
                readProfileCache(userId) ??
                buildProfileFromAuth(activeUser),
              error: null,
              cloudSyncOffline: true,
            }));
          },
        );
      }

      setProfileSyncing(true);

      try {
        await activeUser.getIdToken();
        if (!isActive) {
          return;
        }

        const { profile, syncedToCloud } = await ensureUserProfile(activeUser);
        if (!isActive) {
          return;
        }

        setProfileSyncState({
          userId,
          hasReceivedProfile: true,
          profile,
          error: null,
          cloudSyncOffline: !syncedToCloud,
        });

        if (syncedToCloud) {
          attachProfileListener();
        }
      } catch {
        if (!isActive) {
          return;
        }

        setProfileSyncState((current) => ({
          userId,
          hasReceivedProfile: true,
          profile:
            current.profile ??
            readProfileCache(userId) ??
            buildProfileFromAuth(activeUser),
          error: null,
          cloudSyncOffline: true,
        }));
      } finally {
        if (isActive) {
          setProfileSyncing(false);
        }
      }
    })();

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
    const {
      buildProfileFromAuth,
      ensureUserProfile,
      subscribeToUserProfile,
    } = await import("@/services/users");

    setProfileSyncing(true);
    setProfileSyncState((current) =>
      current.userId === userId ? { ...current, error: null } : current,
    );

    try {
      await activeUser.getIdToken();
      const { profile, syncedToCloud } = await ensureUserProfile(activeUser);

      setProfileSyncState({
        userId,
        hasReceivedProfile: true,
        profile,
        error: null,
        cloudSyncOffline: !syncedToCloud,
      });

      profileUnsubscribeRef.current?.();
      profileUnsubscribeRef.current = null;

      if (syncedToCloud) {
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
              cloudSyncOffline: false,
            });
          },
          () => {
            setProfileSyncState((current) => ({
              userId,
              hasReceivedProfile: true,
              profile:
                current.profile ??
                readProfileCache(userId) ??
                buildProfileFromAuth(activeUser),
              error: null,
              cloudSyncOffline: true,
            }));
          },
        );
      }
    } catch {
      setProfileSyncState((current) => ({
        userId,
        hasReceivedProfile: true,
        profile:
          current.profile ??
          readProfileCache(userId) ??
          buildProfileFromAuth(activeUser),
        error: null,
        cloudSyncOffline: true,
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

  const cloudSyncOffline = useMemo(() => {
    if (
      !userId ||
      profileSyncState.userId !== userId ||
      !profileSyncState.hasReceivedProfile
    ) {
      return false;
    }

    return profileSyncState.cloudSyncOffline;
  }, [userId, profileSyncState]);

  useEffect(() => {
    if (!user || !cloudSyncOffline) {
      return;
    }

    function handleOnline() {
      void retryProfileSync();
    }

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [user, cloudSyncOffline, retryProfileSync]);

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
    const [{ signInWithGoogle: startGoogleSignIn }, auth] = await Promise.all([
      import("@/lib/firebase/google-auth"),
      ensureFirebaseAuth(),
    ]);
    const method = await startGoogleSignIn(auth);

    if (method === "popup") {
      closeAuthModal();
    }

    return method;
  }, [closeAuthModal]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const [{ signInWithEmailAndPassword }, auth] = await Promise.all([
        import("firebase/auth"),
        ensureFirebaseAuth(),
      ]);
      await signInWithEmailAndPassword(auth, email, password);
      closeAuthModal();
    },
    [closeAuthModal],
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      const [{ createUserWithEmailAndPassword }, auth] = await Promise.all([
        import("firebase/auth"),
        ensureFirebaseAuth(),
      ]);
      await createUserWithEmailAndPassword(auth, email, password);
      closeAuthModal();
    },
    [closeAuthModal],
  );

  const logout = useCallback(async () => {
    const [{ signOut }, auth] = await Promise.all([
      import("firebase/auth"),
      ensureFirebaseAuth(),
    ]);
    await signOut(auth);
  }, []);

  const updateUserProfile = useCallback(
    async (input: import("@/services/users").UpdateUserProfileInput) => {
      if (!user) {
        throw new Error("You must be signed in to update your profile.");
      }

      const { updateUserProfile: persistUserProfile } = await import("@/services/users");
      const profile = await persistUserProfile(user, input);
      const auth = getFirebaseAuth();

      if (auth.currentUser) {
        setUser(auth.currentUser);
      }

      setProfileSyncState((current) => ({
        userId: user.uid,
        hasReceivedProfile: true,
        profile,
        error: null,
        cloudSyncOffline: current.cloudSyncOffline,
      }));

      return profile;
    },
    [user],
  );

  const uploadProfilePhoto = useCallback(
    async (file: File) => {
      if (!user) {
        throw new Error("You must be signed in to upload a profile photo.");
      }

      const { uploadUserAvatar } = await import("@/services/users");
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
      cloudSyncOffline,
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
      cloudSyncOffline,
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
