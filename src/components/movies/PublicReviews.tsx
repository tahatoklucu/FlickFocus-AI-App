"use client";

import { useEffect, useState } from "react";
import UserAvatar from "@/components/profile/UserAvatar";
import { useAuth } from "@/context/auth-context.shared";
import { isFirebaseConfigured } from "@/lib/firebase";
import type { PublicReview } from "@/types";

function formatDate(iso: string): string | null {
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

function StarIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function ReviewCard({ review }: { review: PublicReview }) {
  const publishedOn = formatDate(review.publishedAt);

  return (
    <li className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
      <div className="flex items-center gap-3">
        <UserAvatar
          displayName={review.displayName}
          photoURL={review.photoURL}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-neutral-100">
            {review.displayName}
          </p>
          {publishedOn && (
            <p className="text-xs text-neutral-400">{publishedOn}</p>
          )}
        </div>
        {review.rating !== null && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-xs font-semibold text-amber-300">
            <StarIcon />
            <span className="sr-only">Rated </span>
            {review.rating}/10
          </span>
        )}
      </div>
      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-300">
        {review.note}
      </p>
    </li>
  );
}

/**
 * Reviews other visitors chose to share for this movie. The signed-in user's
 * own review is left out, since they already see it in their controls above.
 */
export default function PublicReviews({ imdbID }: { imdbID: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<PublicReview[]>([]);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      return;
    }

    let isActive = true;
    let unsubscribe = () => {};

    void (async () => {
      const { subscribeToPublicReviews } = await import("@/services/reviews");

      const stop = subscribeToPublicReviews(imdbID, (next) => {
        if (isActive) {
          setReviews(next);
        }
      });

      if (isActive) {
        unsubscribe = stop;
      } else {
        stop();
      }
    })();

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [imdbID]);

  const others = reviews.filter((review) => review.userId !== user?.uid);

  if (others.length === 0) {
    return null;
  }

  return (
    <section className="text-left">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
        Community reviews ({others.length})
      </h3>
      <ul className="space-y-3">
        {others.map((review) => (
          <ReviewCard key={review.userId} review={review} />
        ))}
      </ul>
    </section>
  );
}
