"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFavorites } from "@/context/FavoritesContext";

const AuthModal = dynamic(() => import("@/components/AuthModal"), {
  ssr: false,
});

function FavoritesCountBadge({ count }: { count: number }) {
  if (count === 0) {
    return null;
  }

  return (
    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-violet-500 px-1.5 py-0.5 text-[10px] font-bold leading-none tabular-nums text-white shadow-sm shadow-violet-500/40">
      {count}
    </span>
  );
}

function DropdownItem({
  href,
  onClick,
  active,
  children,
}: {
  href?: string;
  onClick?: () => void;
  active?: boolean;
  children: ReactNode;
}) {
  const className = `flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition ${
    active
      ? "bg-white/10 text-white"
      : "text-neutral-300 hover:bg-white/5 hover:text-white"
  }`;

  if (href) {
    return (
      <Link href={href} role="menuitem" onClick={onClick} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" role="menuitem" onClick={onClick} className={className}>
      {children}
    </button>
  );
}

export default function Header() {
  const pathname = usePathname();
  const { user, loading, isConfigured, openAuthModal, logout } = useAuth();
  const { favorites } = useFavorites();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const favoritesCount = favorites.length;
  const displayName =
    user?.displayName ?? user?.email?.split("@")[0] ?? "User";

  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 12);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  async function handleLogout() {
    closeMenu();
    await logout();
  }

  return (
    <>
      <header
        className={`sticky top-0 z-40 border-b transition-all duration-300 ease-out ${
          isScrolled
            ? "border-neutral-800/50 bg-neutral-950/80 shadow-lg shadow-black/20 backdrop-blur-md"
            : "border-transparent bg-neutral-950/50 backdrop-blur-sm"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-8">
            <Link
              href="/"
              className="group shrink-0 transition-transform duration-200 hover:scale-[1.02]"
            >
              <p className="bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-lg font-bold tracking-tight text-transparent">
                FlickFocus
              </p>
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {!isConfigured ? null : loading ? (
              <div className="h-9 w-28 animate-pulse rounded-full bg-neutral-800/80" />
            ) : user ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen((open) => !open)}
                  className="flex items-center gap-2 rounded-full border border-neutral-700/60 bg-neutral-900/70 py-1.5 pl-1.5 pr-3 text-sm font-medium text-neutral-100 shadow-sm shadow-black/20 transition-all duration-200 hover:scale-[1.02] hover:border-neutral-600 hover:bg-neutral-800/90 hover:shadow-md hover:shadow-black/30"
                  aria-expanded={isMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Open profile menu"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-xs font-bold text-white shadow-inner">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden max-w-[120px] truncate sm:inline">
                    {displayName}
                  </span>
                  <svg
                    className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`}
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
                    aria-label="Profile menu"
                    className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-neutral-800/80 bg-neutral-950/95 py-1 shadow-xl shadow-black/40 backdrop-blur-md"
                  >
                    <div className="border-b border-neutral-800/80 px-4 py-3">
                      <p className="truncate text-sm font-medium text-white">
                        {displayName}
                      </p>
                      <p className="truncate text-xs text-neutral-500">
                        {user.email}
                      </p>
                    </div>

                    <div className="py-1">
                      <DropdownItem
                        href="/favorites"
                        active={pathname === "/favorites"}
                        onClick={closeMenu}
                      >
                        <span>Favorites</span>
                        <FavoritesCountBadge count={favoritesCount} />
                      </DropdownItem>
                      <DropdownItem
                        href="/profile"
                        active={pathname === "/profile"}
                        onClick={closeMenu}
                      >
                        Profile Settings
                      </DropdownItem>
                    </div>

                    <div className="border-t border-neutral-800/80 py-1">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                        className="flex w-full px-4 py-2.5 text-left text-sm text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openAuthModal("signin")}
                  className="rounded-full px-4 py-2 text-sm font-medium text-neutral-300 transition-all duration-200 hover:scale-[1.02] hover:bg-white/5 hover:text-white"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal("signup")}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-950 shadow-md shadow-black/20 transition-all duration-200 hover:scale-[1.03] hover:bg-neutral-100 hover:shadow-lg hover:shadow-black/30"
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
