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
import {
  buildLibraryShelfQuery,
  DEFAULT_LIBRARY_SHELF,
  MENU_LIBRARY_TABS,
  parseLibraryShelf,
} from "@/lib/library-tabs";
import type { LibraryShelf } from "@/types";

const AuthModal = dynamic(() => import("@/components/auth/AuthModal"), {
  ssr: false,
});

function ShelfCountBadge({ count }: { count: number }) {
  if (count === 0) {
    return null;
  }

  return (
    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-violet-500 px-1.5 py-0.5 text-[10px] font-bold leading-none tabular-nums text-white shadow-sm shadow-violet-500/40">
      {count}
    </span>
  );
}

function GearIcon() {
  return (
    <svg
      className="h-4 w-4 text-neutral-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.114 1.205-.135l.734-.523a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.523.734c-.25.35-.3.807-.135 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.114.855.135 1.205l.523.734c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.734-.523a1.125 1.125 0 00-1.205-.135c-.396.165-.71.505-.78.93l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93a1.125 1.125 0 00-1.204.135l-.735.523a1.125 1.125 0 01-1.449-.12l-.773-.774a1.125 1.125 0 01-.12-1.449l.522-.734c.25-.35.3-.807.136-1.205-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.114-.855-.136-1.205l-.522-.734a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.734.523c.35.249.807.3 1.204.135.397-.166.71-.506.781-.93l.148-.894z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3.75 0l3-3m0 0l-3-3m3 3H9"
      />
    </svg>
  );
}

function ShelfIcon({ shelf }: { shelf: LibraryShelf }) {
  if (shelf === "favorite") {
    return (
      <svg className="h-4 w-4 text-red-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 21.364l-7.682-7.682a4.5 4.5 0 116.364-6.364L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21.364z" />
      </svg>
    );
  }

  if (shelf === "watchlist") {
    return (
      <svg className="h-4 w-4 text-violet-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M6 3.75A1.75 1.75 0 004.25 5.5v15.02a.75.75 0 001.17.62L12 16.6l6.58 4.54a.75.75 0 001.17-.62V5.5A1.75 1.75 0 0018 3.75H6z" />
      </svg>
    );
  }

  return (
    <svg
      className="h-4 w-4 text-emerald-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
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
  const { favorites, watchlist, watched } = useFavorites();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  /**
   * Which shelf the library page is showing. Tabs there are pushed with the
   * History API, so it is read when the menu opens rather than tracked.
   */
  const [openShelf, setOpenShelf] = useState<LibraryShelf>(DEFAULT_LIBRARY_SHELF);
  const menuRef = useRef<HTMLDivElement>(null);

  const shelfCounts: Record<LibraryShelf, number> = {
    favorite: favorites.length,
    watchlist: watchlist.length,
    watched: watched.length,
  };

  const displayName =
    userProfile?.displayName ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "User";

  const photoURL = resolveUserPhotoURL(userProfile, user);

  const closeMenu = () => setIsMenuOpen(false);

  function toggleMenu() {
    if (!isMenuOpen) {
      setOpenShelf(parseLibraryShelf(window.location.search));
    }
    setIsMenuOpen(!isMenuOpen);
  }

  useEffect(() => {
    let frame: number | null = null;

    function readScrollPosition() {
      frame = null;
      setIsScrolled(window.scrollY > 12);
    }

    // Coalesce to one read per frame; the raw scroll event can fire far more
    // often and each call risks a header re-render.
    function handleScroll() {
      if (frame === null) {
        frame = requestAnimationFrame(readScrollPosition);
      }
    }

    readScrollPosition();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frame !== null) {
        cancelAnimationFrame(frame);
      }
    };
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
        className={`sticky top-0 z-40 h-16 shrink-0 border-b transition-all duration-300 ease-out ${
          isScrolled
            ? "border-neutral-800/50 bg-neutral-950/80 shadow-lg shadow-black/20 backdrop-blur-md"
            : "border-transparent bg-neutral-950/50 backdrop-blur-sm"
        }`}
      >
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
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
                  onClick={toggleMenu}
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
                    className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-neutral-800/80 bg-neutral-950/95 shadow-xl shadow-black/40 backdrop-blur-md"
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
                          <p className="truncate text-xs text-neutral-400">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="divide-y divide-neutral-800/80">
                      {MENU_LIBRARY_TABS.map((tab) => {
                        const count = shelfCounts[tab.shelf];

                        return (
                          <DropdownItem
                            key={tab.shelf}
                            href={`/favorites${buildLibraryShelfQuery(tab.shelf)}`}
                            active={
                              pathname === "/favorites" && openShelf === tab.shelf
                            }
                            onClick={closeMenu}
                            ariaLabel={
                              count > 0
                                ? `${tab.label}, ${count} movie${count === 1 ? "" : "s"}`
                                : tab.label
                            }
                          >
                            <ShelfIcon shelf={tab.shelf} />
                            <span>{tab.label}</span>
                            <ShelfCountBadge count={count} />
                          </DropdownItem>
                        );
                      })}

                      <DropdownItem
                        href="/profile"
                        active={pathname === "/profile"}
                        onClick={closeMenu}
                      >
                        <GearIcon />
                        <span>Profile Settings</span>
                      </DropdownItem>

                      <Button
                        type="button"
                        role="menuitem"
                        variant="menuDanger"
                        onClick={handleLogout}
                      >
                        <SignOutIcon />
                        <span>Sign Out</span>
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
