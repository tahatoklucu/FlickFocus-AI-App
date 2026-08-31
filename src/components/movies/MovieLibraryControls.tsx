"use client";

import { useState, type ReactNode } from "react";
import StarRating from "@/components/movies/StarRating";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/auth-context.shared";
import { useFavorites } from "@/context/favorites-context.shared";
import { cn } from "@/lib/cn";
import { MAX_USER_NOTE_LENGTH, type AddFavoritePayload } from "@/types";

interface MovieLibraryControlsProps {
  movie: AddFavoritePayload;
  className?: string;
}

function HeartIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 21.364l-7.682-7.682a4.5 4.5 0 116.364-6.364L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21.364z" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 3.75A1.75 1.75 0 004.25 5.5v15.02a.75.75 0 001.17.62L12 16.6l6.58 4.54a.75.75 0 001.17-.62V5.5A1.75 1.75 0 0018 3.75H6z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4"
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

function ShelfToggle({
  label,
  activeLabel,
  active,
  activeClassName,
  icon,
  onClick,
}: {
  label: string;
  activeLabel: string;
  active: boolean;
  activeClassName: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40",
        active
          ? activeClassName
          : "border-neutral-700 bg-neutral-900/70 text-neutral-300 hover:border-neutral-500 hover:bg-neutral-800 hover:text-white",
      )}
    >
      {icon}
      {active ? activeLabel : label}
    </button>
  );
}

/**
 * Shelf toggles plus the personal rating and note for one movie. Signed-out
 * visitors get the auth modal instead of a silent no-op.
 */
export default function MovieLibraryControls({
  movie,
  className,
}: MovieLibraryControlsProps) {
  const { user, openAuthModal } = useAuth();
  const {
    getEntry,
    isFavorite,
    isInWatchlist,
    isWatched,
    toggleFavorite,
    toggleWatchlist,
    toggleWatched,
    updateEntry,
  } = useFavorites();

  const entry = getEntry(movie.imdbID);
  const [noteDraft, setNoteDraft] = useState<string | null>(null);
  const savedNote = entry?.note ?? "";
  const noteValue = noteDraft ?? savedNote;
  const noteDirty = noteValue.trim() !== savedNote;

  function requireAuth(action: () => void) {
    if (!user) {
      openAuthModal("signin");
      return;
    }
    action();
  }

  const watched = isWatched(movie.imdbID);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap justify-center gap-2 md:justify-start">
        <ShelfToggle
          label="Favorite"
          activeLabel="Favorited"
          active={isFavorite(movie.imdbID)}
          activeClassName="border-red-400/40 bg-red-500/15 text-red-200"
          icon={<HeartIcon />}
          onClick={() => requireAuth(() => toggleFavorite(movie))}
        />
        <ShelfToggle
          label="Watchlist"
          activeLabel="In watchlist"
          active={isInWatchlist(movie.imdbID)}
          activeClassName="border-violet-400/40 bg-violet-500/20 text-violet-200"
          icon={<BookmarkIcon />}
          onClick={() => requireAuth(() => toggleWatchlist(movie))}
        />
        <ShelfToggle
          label="Mark watched"
          activeLabel="Watched"
          active={watched}
          activeClassName="border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
          icon={<CheckIcon />}
          onClick={() => requireAuth(() => toggleWatched(movie))}
        />
      </div>

      <div className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 text-left">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Your rating
          </h3>
          <div className="mt-2">
            <StarRating
              value={entry?.rating ?? null}
              onChange={(rating) =>
                requireAuth(() => updateEntry(movie, { rating }))
              }
            />
          </div>
        </div>

        <div>
          <label
            htmlFor={`note-${movie.imdbID}`}
            className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400"
          >
            Your note
          </label>
          <textarea
            id={`note-${movie.imdbID}`}
            value={noteValue}
            maxLength={MAX_USER_NOTE_LENGTH}
            rows={3}
            onChange={(event) => setNoteDraft(event.target.value)}
            placeholder="Why does this one matter to you?"
            className="mt-2 w-full resize-y rounded-lg border border-neutral-800 bg-neutral-950/80 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-xs text-neutral-400">
              {noteValue.length}/{MAX_USER_NOTE_LENGTH}
            </p>
            <div className="flex gap-2">
              {noteDirty && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setNoteDraft(null)}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="button"
                variant="violet"
                size="sm"
                disabled={!noteDirty}
                onClick={() =>
                  requireAuth(() => {
                    updateEntry(movie, { note: noteValue });
                    setNoteDraft(null);
                  })
                }
              >
                Save note
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
