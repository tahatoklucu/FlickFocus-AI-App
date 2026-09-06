"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import { buttonClass } from "@/lib/button-styles";
import { useAuth } from "@/context/auth-context.shared";
import { useFavorites } from "@/context/favorites-context.shared";
import {
  aggregateGenres,
  computeLibraryStats,
  type NamedCount,
} from "@/lib/library-stats";
import { cn } from "@/lib/cn";

const GENRE_SAMPLE_LIMIT = 24;

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-neutral-400">{hint}</p> : null}
    </div>
  );
}

function DistributionBars({
  items,
  emptyLabel,
}: {
  items: NamedCount[];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-neutral-400">{emptyLabel}</p>;
  }

  const max = Math.max(...items.map((item) => item.count));

  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-medium text-neutral-200">
              {item.label}
            </span>
            <span className="shrink-0 tabular-nums text-neutral-400">
              {item.count}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-neutral-800">
            <div
              className="h-full rounded-full bg-violet-400/80"
              style={{ width: `${Math.max(8, (item.count / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function RatingHistogram({ histogram }: { histogram: number[] }) {
  const max = Math.max(1, ...histogram.slice(1));
  const hasRatings = histogram.some((count, index) => index > 0 && count > 0);

  if (!hasRatings) {
    return (
      <p className="text-sm text-neutral-400">
        Rate a few movies to see your score spread.
      </p>
    );
  }

  return (
    <div className="flex h-28 items-end gap-1.5">
      {histogram.slice(1).map((count, index) => {
        const score = index + 1;
        const height = count === 0 ? 6 : Math.max(12, (count / max) * 100);

        return (
          <div key={score} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] tabular-nums text-neutral-500">
              {count > 0 ? count : ""}
            </span>
            <div
              className={cn(
                "w-full rounded-t-sm",
                count > 0 ? "bg-amber-400/80" : "bg-neutral-800",
              )}
              style={{ height: `${height}%` }}
              title={`${score}/10: ${count}`}
            />
            <span className="text-[10px] font-medium tabular-nums text-neutral-400">
              {score}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function MovieMiniList({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: { imdbID: string; title: string; year: string; detail: string }[];
}) {
  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-400">{empty}</p>
      ) : (
        <ul className="mt-3 divide-y divide-neutral-800/80">
          {items.map((item) => (
            <li key={item.imdbID} className="flex items-baseline justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <Link
                  href={`/movie/${item.imdbID}`}
                  className="truncate text-sm font-semibold text-neutral-100 hover:text-white"
                >
                  {item.title}
                </Link>
                <p className="text-xs text-neutral-400">{item.year}</p>
              </div>
              <span className="shrink-0 text-xs font-medium tabular-nums text-amber-300">
                {item.detail}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function StatsPageClient() {
  const { user, loading: authLoading, isConfigured, openAuthModal } = useAuth();
  const { entries, syncing, error, clearError } = useFavorites();
  const stats = useMemo(() => computeLibraryStats(entries), [entries]);

  const genreSampleIds = useMemo(() => {
    if (!user || entries.length === 0) {
      return [] as string[];
    }

    const watched = entries.filter((entry) => entry.watchedAt !== null);
    const source = watched.length > 0 ? watched : entries;

    return source.slice(0, GENRE_SAMPLE_LIMIT).map((entry) => entry.imdbID);
  }, [user, entries]);

  const genreSampleKey = genreSampleIds.join("|");
  const [genreResult, setGenreResult] = useState<{
    key: string;
    genres: NamedCount[];
  }>({ key: "", genres: [] });

  const genres =
    genreSampleIds.length === 0
      ? []
      : genreResult.key === genreSampleKey
        ? genreResult.genres
        : [];
  const genresLoading =
    genreSampleIds.length > 0 && genreResult.key !== genreSampleKey;

  useEffect(() => {
    if (genreSampleIds.length === 0) {
      return;
    }

    const key = genreSampleKey;
    let cancelled = false;

    void (async () => {
      const { getMovieById } = await import("@/services/omdb.client");
      const genreLists: string[] = [];

      for (let index = 0; index < genreSampleIds.length; index += 4) {
        const batch = genreSampleIds.slice(index, index + 4);
        const results = await Promise.allSettled(
          batch.map((imdbID) => getMovieById(imdbID)),
        );

        for (const result of results) {
          if (result.status === "fulfilled" && result.value.Genre) {
            genreLists.push(result.value.Genre);
          }
        }
      }

      if (!cancelled) {
        setGenreResult({
          key,
          genres: aggregateGenres(genreLists).slice(0, 8),
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [genreSampleIds, genreSampleKey]);

  if (!isConfigured) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-6 py-16 text-center">
        <p className="text-sm font-medium text-neutral-300">
          Firebase is not configured yet.
        </p>
        <p className="mt-2 text-xs text-neutral-400">
          Add your Firebase environment variables to enable library stats.
        </p>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 px-6 py-16 text-center">
        <p className="text-sm text-neutral-400">Loading your account…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 px-6 py-16 text-center">
        <p className="text-sm font-medium text-neutral-200">
          Sign in to see your viewing stats
        </p>
        <p className="mt-2 text-xs text-neutral-400">
          Stats are built from your watched history, ratings, and shelves.
        </p>
        <Button
          type="button"
          variant="violet"
          className="mt-5"
          onClick={() => openAuthModal("signin")}
        >
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={clearError}
            className="text-xs font-semibold underline-offset-2 hover:underline"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {syncing ? (
        <p className="text-sm text-neutral-400">Syncing your library…</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Watched" value={String(stats.watchedCount)} />
        <StatCard label="Favorites" value={String(stats.favoriteCount)} />
        <StatCard label="Watchlist" value={String(stats.watchlistCount)} />
        <StatCard
          label="Avg rating"
          value={stats.averageRating !== null ? `${stats.averageRating}` : "—"}
          hint={
            stats.ratedCount > 0
              ? `${stats.ratedCount} rated · ${stats.reviewCount} review${stats.reviewCount === 1 ? "" : "s"}`
              : "No personal ratings yet"
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Rating spread
          </h2>
          <RatingHistogram histogram={stats.ratingHistogram} />
        </section>

        <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Release decades
          </h2>
          <DistributionBars
            items={stats.yearBuckets}
            emptyLabel="Add movies to your library to see decade trends."
          />
        </section>
      </div>

      <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Genre mix
          </h2>
          {genresLoading ? (
            <span className="text-xs text-neutral-500">Loading from OMDb…</span>
          ) : null}
        </div>
        <DistributionBars
          items={genres}
          emptyLabel={
            genresLoading
              ? "Fetching genres for your titles…"
              : "Watch or save a few titles to estimate your genre mix."
          }
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <MovieMiniList
          title="Top rated"
          empty="Rate movies to build this list."
          items={stats.topRated.map((entry) => ({
            imdbID: entry.imdbID,
            title: entry.title,
            year: entry.year,
            detail: entry.rating !== null ? `${entry.rating}/10` : "",
          }))}
        />
        <MovieMiniList
          title="Recently watched"
          empty="Mark titles as watched to fill this list."
          items={stats.recentWatched.map((entry) => ({
            imdbID: entry.imdbID,
            title: entry.title,
            year: entry.year,
            detail: entry.rating !== null ? `${entry.rating}/10` : "Watched",
          }))}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/favorites?tab=watched" className={buttonClass("secondary", "md")}>
          Open watched shelf
        </Link>
        <Link href="/chat" className={buttonClass("violet", "md")}>
          Ask AI for recommendations
        </Link>
      </div>
    </div>
  );
}
