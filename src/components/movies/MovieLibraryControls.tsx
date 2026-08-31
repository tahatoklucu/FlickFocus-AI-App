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

function formatReviewDate(iso: string | null): string | null {
  if (!iso) {
    return null;
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function GlobeIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden="true"
    >
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path strokeLinecap="round" d="M8.5 10.5V7.75a3.5 3.5 0 017 0v2.75" />
    </svg>
  );
}

/** Switch controlling whether a review is shown to other visitors. */
function VisibilitySwitch({
  id,
  isPublic,
  onChange,
}: {
  id: string;
  isPublic: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={isPublic}
        onClick={() => onChange(!isPublic)}
        className={cn(
          "mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40",
          isPublic
            ? "border-violet-400/50 bg-violet-500/80"
            : "border-neutral-700 bg-neutral-800",
        )}
      >
        <span
          className={cn(
            "h-3.5 w-3.5 rounded-full bg-white transition-transform",
            isPublic ? "translate-x-[1.15rem]" : "translate-x-[0.15rem]",
          )}
        />
      </button>
      <label htmlFor={id} className="cursor-pointer text-xs leading-snug text-neutral-300">
        Share on the movie page
        <span className="block text-neutral-400">
          {isPublic
            ? "Everyone sees it with your name and photo."
            : "Only you can see it."}
        </span>
      </label>
    </div>
  );
}

function VisibilityBadge({ isPublic }: { isPublic: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        isPublic
          ? "bg-violet-500/15 text-violet-200"
          : "bg-neutral-800 text-neutral-300",
      )}
    >
      {isPublic ? <GlobeIcon /> : <LockIcon />}
      {isPublic ? "Public" : "Only you"}
    </span>
  );
}

/** Read-only view of a saved review, with the ways out of it. */
function PublishedReview({
  note,
  updatedAt,
  isPublic,
  onEdit,
  onRemove,
  onToggleVisibility,
}: {
  note: string;
  updatedAt: string | null;
  isPublic: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onToggleVisibility: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const publishedOn = formatReviewDate(updatedAt);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Your review
          </h3>
          <VisibilityBadge isPublic={isPublic} />
        </div>
        {publishedOn && (
          <p className="text-xs text-neutral-500">Published {publishedOn}</p>
        )}
      </div>

      <blockquote className="mt-2 rounded-lg border-l-2 border-violet-500/60 bg-neutral-950/60 px-3 py-2.5">
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-200">
          {note}
        </p>
      </blockquote>

      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        {confirming ? (
          <>
            <p className="mr-auto text-xs text-neutral-400">
              Remove this review and its rating?
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirming(false)}
            >
              Keep
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => {
                setConfirming(false);
                onRemove();
              }}
            >
              Remove
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onToggleVisibility}
              className="mr-auto"
            >
              {isPublic ? <LockIcon /> : <GlobeIcon />}
              {isPublic ? "Make private" : "Share publicly"}
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={onEdit}>
              Edit
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirming(true)}
              className="text-red-300 hover:text-red-200"
            >
              Remove
            </Button>
          </>
        )}
      </div>
    </div>
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
  const savedNote = entry?.note ?? "";
  const savedIsPublic = entry?.isPublic === true;
  const [noteDraft, setNoteDraft] = useState<string | null>(null);
  const [shareDraft, setShareDraft] = useState<boolean | null>(null);
  const isEditing = noteDraft !== null;
  const noteValue = noteDraft ?? "";
  const shareValue = shareDraft ?? savedIsPublic;
  const noteDirty =
    noteValue.trim() !== savedNote || shareValue !== savedIsPublic;

  function closeEditor() {
    setNoteDraft(null);
    setShareDraft(null);
  }

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

        <div className="border-t border-neutral-800/70 pt-3">
          {savedNote && !isEditing ? (
            <PublishedReview
              note={savedNote}
              updatedAt={entry?.updatedAt ?? null}
              isPublic={savedIsPublic}
              onEdit={() => setNoteDraft(savedNote)}
              onRemove={() =>
                requireAuth(() => updateEntry(movie, { note: null, rating: null }))
              }
              onToggleVisibility={() =>
                requireAuth(() => updateEntry(movie, { isPublic: !savedIsPublic }))
              }
            />
          ) : (
            <div>
              <label
                htmlFor={`note-${movie.imdbID}`}
                className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400"
              >
                {savedNote ? "Edit your review" : "Your review"}
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
              <p className="mt-1.5 text-xs text-neutral-400">
                {noteValue.length}/{MAX_USER_NOTE_LENGTH}
              </p>

              <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                <VisibilitySwitch
                  id={`share-${movie.imdbID}`}
                  isPublic={shareValue}
                  onChange={setShareDraft}
                />
                <div className="flex gap-2">
                  {isEditing && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={closeEditor}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="violet"
                    size="sm"
                    disabled={!noteDirty || noteValue.trim().length === 0}
                    onClick={() =>
                      requireAuth(() => {
                        updateEntry(movie, {
                          note: noteValue,
                          isPublic: shareValue,
                        });
                        closeEditor();
                      })
                    }
                  >
                    {savedNote ? "Update review" : "Publish review"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
