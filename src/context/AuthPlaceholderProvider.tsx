"use client";

import {
  AuthContext,
  type AuthContextValue,
  type AuthModalMode,
  type AuthPlaceholderProviderProps,
} from "@/context/auth-context.shared";
import {
  FavoritesContext,
  type FavoritesContextValue,
} from "@/context/favorites-context.shared";
import { isFirebaseConfigured } from "@/lib/firebase-config";
import { useCallback, useMemo } from "react";

export function AuthPlaceholderProvider({
  children,
  onActivateFirebase,
}: AuthPlaceholderProviderProps) {
  const openAuthModal = useCallback(
    (mode: AuthModalMode = "signin") => {
      onActivateFirebase({ openAuthModal: mode });
    },
    [onActivateFirebase],
  );

  const authValue = useMemo<AuthContextValue>(
    () => ({
      user: null,
      userProfile: null,
      loading: false,
      redirectResolving: false,
      profileLoading: false,
      profileSyncing: false,
      profileError: null,
      cloudSyncOffline: false,
      isConfigured: isFirebaseConfigured(),
      isAuthModalOpen: false,
      authModalMode: "signin",
      openAuthModal,
      closeAuthModal: () => {},
      signInWithGoogle: async () => {
        openAuthModal("signin");
        return "popup";
      },
      signInWithEmail: async () => {
        openAuthModal("signin");
      },
      signUpWithEmail: async () => {
        openAuthModal("signup");
      },
      logout: async () => {},
      authError: null,
      clearAuthError: () => {},
      clearProfileError: () => {},
      retryProfileSync: async () => {},
      updateUserProfile: async () => {
        throw new Error("Sign in to update your profile.");
      },
      uploadProfilePhoto: async () => {
        throw new Error("Sign in to upload a profile photo.");
      },
    }),
    [openAuthModal],
  );

  const emptyFavoriteIds = useMemo(() => new Set<string>(), []);

  const favoritesValue = useMemo<FavoritesContextValue>(
    () => ({
      favorites: [],
      favoriteIds: emptyFavoriteIds,
      loading: false,
      syncing: false,
      error: null,
      isFavorite: () => false,
      toggleFavorite: () => openAuthModal("signin"),
      clearError: () => {},
    }),
    [emptyFavoriteIds, openAuthModal],
  );

  return (
    <AuthContext.Provider value={authValue}>
      <FavoritesContext.Provider value={favoritesValue}>
        {children}
      </FavoritesContext.Provider>
    </AuthContext.Provider>
  );
}
