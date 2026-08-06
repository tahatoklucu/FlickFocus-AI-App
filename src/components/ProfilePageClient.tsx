"use client";

import type { User } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFavorites } from "@/context/FavoritesContext";
import type { UserProfile } from "@/types/user";

function getAuthDisplayName(user: User): string {
  return user.displayName ?? user.email?.split("@")[0] ?? "User";
}

function getProviderLabel(user: User): string {
  const providerId = user.providerData[0]?.providerId ?? "unknown";

  switch (providerId) {
    case "google.com":
      return "Google";
    case "password":
      return "Email & Password";
    default:
      return providerId;
  }
}

function formatDate(value: string | undefined): string {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function resolveDisplayName(
  user: User,
  userProfile: UserProfile | null,
): string {
  return userProfile?.displayName || getAuthDisplayName(user);
}

function resolveEmail(user: User, userProfile: UserProfile | null): string {
  return userProfile?.email || user.email || "No email on file";
}

function resolvePhotoURL(
  user: User,
  userProfile: UserProfile | null,
): string | null {
  return userProfile?.photoURL || user.photoURL || null;
}

export default function ProfilePageClient() {
  const router = useRouter();
  const {
    user,
    userProfile,
    loading: authLoading,
    profileError,
    isConfigured,
    openAuthModal,
    logout,
    clearProfileError,
  } = useAuth();
  const { favorites, syncing: favoritesSyncing } = useFavorites();

  const isProfilePending = authLoading;

  const displayName = useMemo(
    () => (user ? resolveDisplayName(user, userProfile) : ""),
    [user, userProfile],
  );

  const email = useMemo(
    () => (user ? resolveEmail(user, userProfile) : ""),
    [user, userProfile],
  );

  const photoURL = useMemo(
    () => (user ? resolvePhotoURL(user, userProfile) : null),
    [user, userProfile],
  );

  const memberSince = useMemo(
    () =>
      userProfile?.createdAt ||
      user?.metadata.creationTime ||
      undefined,
    [userProfile, user],
  );

  const handleSignOut = useCallback(async () => {
    await logout();
    router.push("/");
  }, [logout, router]);

  if (!isConfigured) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white px-6 py-16 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Firebase is not configured yet.
        </p>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Add your Firebase environment variables to enable account features.
        </p>
      </div>
    );
  }

  if (isProfilePending) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-zinc-500 dark:text-zinc-400">
        <svg
          className="h-8 w-8 animate-spin"
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
        <p className="text-sm font-medium">Loading your profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-zinc-200 bg-white px-6 py-16 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-2xl font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          ?
        </span>
        <div>
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
            Sign in to view your profile
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Access your account details, favorites count, and preferences.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openAuthModal("signin")}
          className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      {profileError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
        >
          <p>
            Could not sync your Firestore profile; showing your session info
            instead. {profileError}
          </p>
          <button
            type="button"
            onClick={clearProfileError}
            className="shrink-0 text-xs font-medium uppercase tracking-wide text-amber-100/80 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          {photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoURL}
              alt={`${displayName} avatar`}
              className="h-20 w-20 rounded-full border border-zinc-200 object-cover dark:border-zinc-700"
            />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-900 text-2xl font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}

          <div className="flex-1">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {displayName}
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {email}
            </p>
            <span className="mt-3 inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              Signed in with {getProviderLabel(user)}
            </span>
          </div>
        </div>

        <dl className="mt-8 grid gap-4 border-t border-zinc-100 pt-6 sm:grid-cols-2 dark:border-zinc-800">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Member since
            </dt>
            <dd className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
              {formatDate(memberSince)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Last sign in
            </dt>
            <dd className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
              {formatDate(user.metadata.lastSignInTime)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Account statistics
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-zinc-50 px-4 py-5 dark:bg-zinc-800/50">
            <p className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
              {favoritesSyncing ? "—" : favorites.length}
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Saved favorites
            </p>
          </div>
          <div className="rounded-xl bg-zinc-50 px-4 py-5 dark:bg-zinc-800/50">
            <p className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
              {user.emailVerified ? "Yes" : "No"}
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Email verified
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Account actions
        </h3>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/favorites"
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            View Favorites
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-red-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
          >
            Sign Out
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Preferences
        </h3>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Additional preference controls (theme, notifications, and default
          search filters) will be available in a future update.
        </p>
      </section>
    </div>
  );
}
