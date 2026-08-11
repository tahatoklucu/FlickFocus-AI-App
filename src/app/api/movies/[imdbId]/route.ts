import { NextResponse } from "next/server";
import { isValidImdbIdParam } from "@/lib/api/api-limits";
import { enforceRateLimit } from "@/lib/api/api-rate-limit";
import { getMovieById } from "@/services/omdb.server";
import { getOMDbErrorMessage, isMovieNotFoundMessage, OMDbError } from "@/services/omdb-core";

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
    const movie = await getMovieById(imdbId);
    return NextResponse.json(movie, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    const message = getOMDbErrorMessage(error, "Failed to load movie details.");

    if (error instanceof OMDbError && isMovieNotFoundMessage(message)) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    const status =
      error instanceof OMDbError && message.toLowerCase().includes("required")
        ? 400
        : 502;

    return NextResponse.json({ error: message }, { status });
  }
}
