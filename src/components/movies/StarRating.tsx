"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { MAX_USER_RATING } from "@/types";

interface StarRatingProps {
  value: number | null;
  onChange: (rating: number | null) => void;
  disabled?: boolean;
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      className={cn(
        "h-5 w-5 transition",
        filled ? "text-amber-300" : "text-neutral-600",
      )}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.5}
      aria-hidden="true"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

/** Ten-star personal score; clicking the current score clears it. */
export default function StarRating({
  value,
  onChange,
  disabled = false,
}: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const shown = hovered ?? value ?? 0;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        role="radiogroup"
        aria-label="Your rating out of 10"
        className="flex items-center"
        onMouseLeave={() => setHovered(null)}
      >
        {Array.from({ length: MAX_USER_RATING }, (_, index) => index + 1).map(
          (score) => (
            <button
              key={score}
              type="button"
              role="radio"
              aria-checked={value === score}
              aria-label={`Rate ${score} out of ${MAX_USER_RATING}`}
              disabled={disabled}
              onMouseEnter={() => setHovered(score)}
              onFocus={() => setHovered(score)}
              onBlur={() => setHovered(null)}
              onClick={() => onChange(value === score ? null : score)}
              className="rounded p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Star filled={score <= shown} />
            </button>
          ),
        )}
      </div>

      <p className="text-sm text-neutral-400" aria-live="polite">
        {value ? (
          <>
            <span className="font-semibold text-amber-300">
              {value}/{MAX_USER_RATING}
            </span>
            <span className="ml-2 hidden sm:inline">your score</span>
          </>
        ) : (
          "Not rated yet"
        )}
      </p>
    </div>
  );
}
