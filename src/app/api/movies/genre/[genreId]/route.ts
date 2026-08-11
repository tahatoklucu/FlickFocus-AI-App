import { NextResponse } from "next/server";
import { isGenreChipId } from "@/constants/genreMovies";
import { enforceRateLimit } from "@/lib/api/api-rate-limit";
import { getGenreMovies } from "@/services/omdb.server";
import { getOMDbErrorMessage, OMDbError } from "@/services/omdb-core";

export const maxDuration = 15;

interface RouteContext {
  params: Promise<{ genreId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const rateLimited = enforceRateLimit(request, "api");
  if (rateLimited) {
    return rateLimited;
  }

  const { genreId } = await context.params;

  if (!isGenreChipId(genreId)) {
    return NextResponse.json({ error: "Invalid genre." }, { status: 400 });
  }

  try {
    const movies = await getGenreMovies(genreId);
    return NextResponse.json(movies, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    const message = getOMDbErrorMessage(error, "Failed to load genre movies.");
    const status =
      error instanceof OMDbError && message.toLowerCase().includes("invalid")
        ? 400
        : 502;

    return NextResponse.json({ error: message }, { status });
  }
}
