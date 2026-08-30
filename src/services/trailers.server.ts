import "server-only";

import { cache } from "react";
import type { MovieTrailer } from "@/types";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_REVALIDATE_SECONDS = 60 * 60 * 24 * 7;
const MAX_TRAILERS = 4;

const ALLOWED_TYPES: ReadonlySet<MovieTrailer["type"]> = new Set([
  "Trailer",
  "Teaser",
  "Clip",
  "Featurette",
]);

export class TrailerError extends Error {
  readonly status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "TrailerError";
    this.status = status;
  }
}

interface TmdbVideo {
  key?: string;
  name?: string;
  site?: string;
  type?: string;
  official?: boolean;
  published_at?: string;
}

interface TmdbFindResponse {
  movie_results?: { id?: number }[];
}

interface TmdbVideosResponse {
  results?: TmdbVideo[];
}

type TmdbCredentials =
  | { kind: "bearer"; token: string }
  | { kind: "apiKey"; apiKey: string };

/** TMDB accepts either a v3 API key query param or a v4 bearer token. */
function getTmdbCredentials(): TmdbCredentials {
  const token = process.env.TMDB_ACCESS_TOKEN?.trim();
  if (token) {
    return { kind: "bearer", token };
  }

  const apiKey = process.env.TMDB_API_KEY?.trim();
  if (apiKey) {
    return { kind: "apiKey", apiKey };
  }

  throw new TrailerError("Trailers are not configured on this server.", 501);
}

async function fetchFromTmdb<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const credentials = getTmdbCredentials();
  const url = new URL(`${TMDB_BASE_URL}${path}`);

  if (credentials.kind === "apiKey") {
    url.searchParams.set("api_key", credentials.apiKey);
  }

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  let response: Response;

  try {
    response = await fetch(url, {
      headers:
        credentials.kind === "bearer"
          ? { Authorization: `Bearer ${credentials.token}` }
          : undefined,
      next: { revalidate: TMDB_REVALIDATE_SECONDS },
    });
  } catch {
    throw new TrailerError("Failed to reach the trailer provider.");
  }

  if (response.status === 401) {
    throw new TrailerError("The trailer provider rejected the API key.", 502);
  }

  if (response.status === 404) {
    throw new TrailerError("No trailer found for this title.", 404);
  }

  if (!response.ok) {
    throw new TrailerError(`Trailer provider request failed (${response.status}).`);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new TrailerError("Received an invalid response from the trailer provider.");
  }
}

/**
 * Ranks official YouTube trailers first so the modal autoplays the most
 * representative video instead of a random clip.
 */
function rankTrailers(videos: TmdbVideo[]): MovieTrailer[] {
  const typeWeight: Record<MovieTrailer["type"], number> = {
    Trailer: 0,
    Teaser: 1,
    Clip: 2,
    Featurette: 3,
  };

  return videos
    .filter((video): video is TmdbVideo & { key: string; type: MovieTrailer["type"] } => {
      return (
        video.site === "YouTube" &&
        typeof video.key === "string" &&
        video.key.length > 0 &&
        ALLOWED_TYPES.has(video.type as MovieTrailer["type"])
      );
    })
    .map((video) => ({
      youtubeKey: video.key,
      name: video.name?.trim() || video.type,
      type: video.type,
      official: video.official === true,
      publishedAt: video.published_at ?? null,
    }))
    .sort((a, b) => {
      if (a.official !== b.official) {
        return a.official ? -1 : 1;
      }
      if (a.type !== b.type) {
        return typeWeight[a.type] - typeWeight[b.type];
      }
      return (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "");
    })
    .slice(0, MAX_TRAILERS);
}

/** Resolves trailers for an IMDb ID by mapping it to a TMDB movie first. */
export const getTrailersByImdbId = cache(async (imdbId: string): Promise<MovieTrailer[]> => {
  const trimmedId = imdbId.trim();

  if (!trimmedId) {
    throw new TrailerError("An IMDb ID is required.", 400);
  }

  const found = await fetchFromTmdb<TmdbFindResponse>(
    `/find/${encodeURIComponent(trimmedId)}`,
    { external_source: "imdb_id" },
  );

  const tmdbId = found.movie_results?.[0]?.id;

  if (typeof tmdbId !== "number") {
    return [];
  }

  const videos = await fetchFromTmdb<TmdbVideosResponse>(`/movie/${tmdbId}/videos`, {
    language: "en-US",
  });

  return rankTrailers(videos.results ?? []);
});
