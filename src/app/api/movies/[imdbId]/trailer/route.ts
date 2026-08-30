import { NextResponse } from "next/server";
import { isValidImdbIdParam } from "@/lib/api/api-limits";
import { enforceRateLimit } from "@/lib/api/api-rate-limit";
import { getTrailersByImdbId, TrailerError } from "@/services/trailers.server";
import type { MovieTrailerResponse } from "@/types";

export const maxDuration = 15;

interface RouteContext {
  params: Promise<{ imdbId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const rateLimited = enforceRateLimit(request, "api");
  if (rateLimited) {
    return rateLimited;
  }

  const { imdbId } = await context.params;

  if (!isValidImdbIdParam(imdbId)) {
    return NextResponse.json({ error: "Invalid IMDb ID." }, { status: 400 });
  }

  try {
    const trailers = await getTrailersByImdbId(imdbId);
    return NextResponse.json<MovieTrailerResponse>(
      { trailers },
      {
        headers: {
          "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=2592000",
        },
      },
    );
  } catch (error) {
    if (error instanceof TrailerError) {
      // An empty result here means "unavailable right now" (missing key or no
      // TMDB match), so it must never be cached as if it were real data.
      if (error.status === 404 || error.status === 501) {
        return NextResponse.json<MovieTrailerResponse>(
          { trailers: [] },
          { headers: { "Cache-Control": "no-store" } },
        );
      }

      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Failed to load trailers." }, { status: 502 });
  }
}
