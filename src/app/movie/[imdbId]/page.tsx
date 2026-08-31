import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MovieDetailView from "@/components/movies/MovieDetailView";
import PageHeroGlow from "@/components/layout/PageHeroGlow";
import { isValidImdbIdParam } from "@/lib/api/api-limits";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { isValidPosterUrl } from "@/lib/poster/poster-url";
import { getMovieById } from "@/services/omdb.server";
import type { Movie } from "@/types";

interface MoviePageProps {
  params: Promise<{ imdbId: string }>;
}

async function loadMovie(imdbId: string): Promise<Movie | null> {
  if (!isValidImdbIdParam(imdbId)) {
    return null;
  }

  try {
    return await getMovieById(imdbId);
  } catch {
    return null;
  }
}

function cleanValue(value: string | undefined): string | null {
  return !value || value === "N/A" ? null : value;
}

function buildDescription(movie: Movie): string {
  const plot = cleanValue(movie.Plot);
  if (plot) {
    return plot.length > 300 ? `${plot.slice(0, 297)}...` : plot;
  }

  const facts = [cleanValue(movie.Year), cleanValue(movie.Genre), cleanValue(movie.Director)]
    .filter(Boolean)
    .join(" · ");

  return facts
    ? `${movie.Title} — ${facts}. Ratings and details on ${SITE_NAME}.`
    : `${movie.Title} details, ratings, and trailer on ${SITE_NAME}.`;
}

export async function generateMetadata({ params }: MoviePageProps): Promise<Metadata> {
  const { imdbId } = await params;
  const movie = await loadMovie(imdbId);

  if (!movie) {
    return {
      title: "Movie not found",
      robots: { index: false, follow: true },
    };
  }

  const year = cleanValue(movie.Year);
  const title = year ? `${movie.Title} (${year})` : movie.Title;
  const description = buildDescription(movie);
  const url = `${SITE_URL}/movie/${movie.imdbID}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      type: "video.movie",
      siteName: SITE_NAME,
      url,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
    },
  };
}

/** JSON-LD so search engines can render rich movie results. */
function MovieStructuredData({ movie }: { movie: Movie }) {
  const imdbRating = cleanValue(movie.imdbRating);
  const votes = cleanValue(movie.imdbVotes)?.replace(/,/g, "");

  const data = {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: movie.Title,
    url: `${SITE_URL}/movie/${movie.imdbID}`,
    image: isValidPosterUrl(movie.Poster) ? movie.Poster : undefined,
    description: cleanValue(movie.Plot) ?? undefined,
    datePublished: cleanValue(movie.Released) ?? cleanValue(movie.Year) ?? undefined,
    genre: cleanValue(movie.Genre)?.split(",").map((entry) => entry.trim()),
    director: cleanValue(movie.Director)
      ? { "@type": "Person", name: movie.Director }
      : undefined,
    actor: cleanValue(movie.Actors)
      ?.split(",")
      .map((name) => ({ "@type": "Person", name: name.trim() })),
    aggregateRating:
      imdbRating && votes
        ? {
            "@type": "AggregateRating",
            ratingValue: imdbRating,
            ratingCount: Number(votes) || undefined,
            bestRating: "10",
            worstRating: "1",
          }
        : undefined,
  };

  return (
    <script
      type="application/ld+json"
      // Serialized server-side from our own typed OMDb payload.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default async function MoviePage({ params }: MoviePageProps) {
  const { imdbId } = await params;
  const movie = await loadMovie(imdbId);

  if (!movie) {
    notFound();
  }

  return (
    <div className="relative flex flex-1 flex-col bg-neutral-950">
      <PageHeroGlow subdued />
      <MovieStructuredData movie={movie} />

      <div className="relative mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-300 transition hover:text-white"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to discovery
          </Link>
        </div>

        <MovieDetailView movie={movie} headingLevel="h1" />
      </div>
    </div>
  );
}
