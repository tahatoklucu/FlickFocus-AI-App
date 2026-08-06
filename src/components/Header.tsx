"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFavorites } from "@/context/FavoritesContext";

const AuthModal = dynamic(() => import("@/components/AuthModal"), {
  ssr: false,
});

function FavoritesCountBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-zinc-200/80 px-1.5 py-0.5 text-[10px] font-semibold leading-none tabular-nums text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
      {count}
    </span>
  );
}

export default function Header() {
  const pathname = usePathname();
  const { user, loading, isConfigured, openAuthModal, logout } = useAuth();
  const { favorites } = useFavorites();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const favoritesCount = favorites.length;
  const showFavoritesBadge = Boolean(user);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setIsMenuOpen(false);
    await logout();
  }

  const displayName =
    user?.displayName ?? user?.email?.split("@")[0] ?? "User";

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link href="/" className="group">
              <p className="text-lg font-bold tracking-tight text-zinc-900 transition group-hover:text-zinc-600 dark:text-zinc-50 dark:group-hover:text-zinc-300">
                FlickFocus
              </p>
              <p className="hidden text-xs text-zinc-500 dark:text-zinc-400 sm:block">
                Discover & save your favorite movies
              </p>
            </Link>

            {isConfigured && (
              <nav className="hidden items-center gap-1 sm:flex">
                <Link
                  href="/"
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    pathname === "/"
                      ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                  }`}
                >
                  Search
                </Link>
                <Link
                  href="/favorites"
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    pathname === "/favorites"
                      ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                  }`}
                >
                  Favorites
                  {showFavoritesBadge && (
                    <FavoritesCountBadge count={favoritesCount} />
                  )}
                </Link>
                {user && (
                  <Link
                    href="/profile"
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                      pathname === "/profile"
                        ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                    }`}
                  >
                    Profile
                  </Link>
                )}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!isConfigured ? null : loading ? (
              <div className="h-9 w-24 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
            ) : user ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen((open) => !open)}
                  className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  aria-expanded={isMenuOpen}
                  aria-haspopup="menu"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden max-w-[140px] truncate sm:inline">
                    {displayName}
                  </span>
                  <svg
                    className={`h-4 w-4 transition ${isMenuOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
                  >
                    <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {displayName}
                      </p>
                      <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {user.email}
                      </p>
                    </div>
                    <Link
                      href="/favorites"
                      role="menuitem"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-zinc-700 transition hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <span>My Favorites</span>
                      {showFavoritesBadge && (
                        <FavoritesCountBadge count={favoritesCount} />
                      )}
                    </Link>
                    <Link
                      href="/profile"
                      role="menuitem"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex w-full px-4 py-2.5 text-left text-sm text-zinc-700 transition hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      My Profile
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full px-4 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openAuthModal("signin")}
                  className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal("signup")}
                  className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <AuthModal />
    </>
  );
}
