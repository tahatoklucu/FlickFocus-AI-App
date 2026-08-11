"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";
import type { UserProfile } from "@/types/user";
import type { UpdateUserProfileInput } from "@/services/users";

export type AuthModalMode = "signin" | "signup";
export type GoogleSignInMethod = "popup" | "redirect";

export interface AuthContextValue {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  redirectResolving: boolean;
  profileLoading: boolean;
  profileSyncing: boolean;
  profileError: string | null;
  cloudSyncOffline: boolean;
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

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}

export type AuthPlaceholderProviderProps = {
  children: ReactNode;
  onActivateFirebase: (options?: { openAuthModal?: AuthModalMode }) => void;
};
