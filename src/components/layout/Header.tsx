"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/context/auth-context.shared";
import { useFavorites } from "@/context/favorites-context.shared";
import Button from "@/components/ui/Button";
import UserAvatar, { resolveUserPhotoURL } from "@/components/profile/UserAvatar";
import { buttonClass } from "@/lib/button-styles";
import { cn } from "@/lib/cn";

const AuthModal = dynamic(() => import("@/components/auth/AuthModal"), {
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
  ariaLabel,
  children,
}: {
  href?: string;
  onClick?: () => void;
  active?: boolean;
  ariaLabel?: string;
  children: ReactNode;
}) {
  const className = cn(
    buttonClass("menu", "md"),
    active && "bg-white/10 text-white",
  );

  if (href) {
    return (
      <Link
        href={href}
        role="menuitem"
        onClick={onClick}
        className={className}
        aria-label={ariaLabel}
      >
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
  const { user, userProfile, loading, isConfigured, openAuthModal, logout } = useAuth();
  const { favorites } = useFavorites();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const favoritesCount = favorites.length;
  const displayName =
    userProfile?.displayName ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "User";

  const photoURL = resolveUserPhotoURL(userProfile, user);

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
        className={`sticky top-0 z-40 shrink-0 border-b transition-all duration-300 ease-out ${
          isScrolled
            ? "border-neutral-800/50 bg-neutral-950/80 shadow-lg shadow-black/20 backdrop-blur-md"
            : "border-transparent bg-neutral-950/50 backdrop-blur-sm"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-4 sm:gap-8">
            <Link
              href="/"
              className="group shrink-0 transition-transform duration-200 hover:scale-[1.02]"
            >
              <p className="bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-lg font-bold tracking-tight text-transparent">
                FlickFocus
              </p>
            </Link>
            <Link
              href="/chat"
              aria-label="AI Chat"
              className={cn(
                buttonClass("iconGhost", "icon"),
                pathname === "/chat" && "bg-violet-500/20 text-violet-300",
                "sm:hidden",
              )}
            >
              <svg
                className="h-5 w-5"
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
            </Link>
            <Link
              href="/chat"
              className={`hidden text-sm font-medium transition-colors sm:inline ${
                pathname === "/chat"
                  ? "text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              AI Chat
            </Link>
          </div>

          <div className="flex h-9 min-w-[7.25rem] shrink-0 items-center justify-end gap-2 sm:min-w-[8.75rem]">
            {!isConfigured ? null : loading ? (
              <div className="h-9 w-28 animate-pulse rounded-full bg-neutral-800/80" aria-hidden="true" />
            ) : user ? (
              <div className="relative" ref={menuRef}>
                <Button
                  type="button"
                  variant="pill"
                  onClick={() => setIsMenuOpen((open) => !open)}
                  className="gap-2 py-1.5 pl-1.5 pr-3"
                  aria-expanded={isMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Open profile menu"
                >
                  <UserAvatar
                    displayName={displayName}
                    photoURL={photoURL}
                    size="sm"
                    className="shrink-0"
                  />
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
                </Button>

                {isMenuOpen && (
                  <div
                    role="menu"
                    aria-label="Profile menu"
                    className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-neutral-800/80 bg-neutral-950/95 py-1 shadow-xl shadow-black/40 backdrop-blur-md"
                  >
                    <div className="border-b border-neutral-800/80 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          displayName={displayName}
                          photoURL={photoURL}
                          size="md"
                          className="shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">
                            {displayName}
                          </p>
                          <p className="truncate text-xs text-neutral-500">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="py-1">
                      <DropdownItem
                        href="/favorites"
                        active={pathname === "/favorites"}
                        onClick={closeMenu}
                        ariaLabel={
                          favoritesCount > 0
                            ? `Favorites, ${favoritesCount} saved`
                            : "Favorites"
                        }
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
                      <Button
                        type="button"
                        role="menuitem"
                        variant="menuDanger"
                        onClick={handleLogout}
                      >
                        Sign Out
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="pillGhost"
                  onClick={() => openAuthModal("signin")}
                >
                  Sign In
                </Button>
                <Button
                  type="button"
                  variant="pillPrimary"
                  onClick={() => openAuthModal("signup")}
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <AuthModal />
    </>
  );
}
