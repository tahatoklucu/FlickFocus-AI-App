"use client";

import { useEffect, useState } from "react";
import UserAvatar from "@/components/profile/UserAvatar";
import Button from "@/components/ui/Button";
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

function ReviewCard({
  review,
  onReport,
}: {
  review: PublicReview;
  onReport: () => void;
}) {
  const publishedOn = formatDate(review.publishedAt);
  const [confirming, setConfirming] = useState(false);

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

      <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
        {confirming ? (
          <>
            <p className="mr-auto text-xs text-neutral-400">
              Report this review to us?
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => {
                setConfirming(false);
                onReport();
              }}
            >
              Report
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfirming(true)}
            className="text-xs text-neutral-400 hover:text-neutral-200"
            aria-label={`Report the review by ${review.displayName}`}
          >
            Report
          </Button>
        )}
      </div>
    </li>
  );
}

/**
 * Reviews other visitors chose to share for this movie. The signed-in user's
 * own review is left out, since they already see it in their controls above.
 */
export default function PublicReviews({ imdbID }: { imdbID: string }) {
  const { user, openAuthModal } = useAuth();
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [reportedIds, setReportedIds] = useState<string[]>([]);
  const [reportError, setReportError] = useState<string | null>(null);

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

  /** Reported reviews are hidden for the reporter right away. */
  const others = reviews.filter(
    (review) =>
      review.userId !== user?.uid && !reportedIds.includes(review.userId),
  );

  function handleReport(review: PublicReview) {
    if (!user) {
      openAuthModal("signin");
      return;
    }

    setReportError(null);
    setReportedIds((current) => [...current, review.userId]);

    void (async () => {
      try {
        const { reportReview } = await import("@/services/reviews");
        await reportReview(
          imdbID,
          review.userId,
          user.uid,
          "Reported from the movie page.",
        );
      } catch (error) {
        setReportedIds((current) =>
          current.filter((id) => id !== review.userId),
        );
        setReportError(
          error instanceof Error
            ? error.message
            : "Failed to report this review.",
        );
      }
    })();
  }

  if (others.length === 0 && !reportError && reportedIds.length === 0) {
    return null;
  }

  return (
    <section className="text-left">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
        Community reviews ({others.length})
      </h3>

      {reportedIds.length > 0 && (
        <p className="mb-3 rounded-lg border border-neutral-800 bg-neutral-900/50 px-3 py-2 text-xs text-neutral-300">
          Thanks for the report. We hid that review for you while we look into
          it.
        </p>
      )}

      {reportError && (
        <p role="alert" className="mb-3 text-xs text-red-300">
          {reportError}
        </p>
      )}

      <ul className="space-y-3">
        {others.map((review) => (
          <ReviewCard
            key={review.userId}
            review={review}
            onReport={() => handleReport(review)}
          />
        ))}
      </ul>
    </section>
  );
}
