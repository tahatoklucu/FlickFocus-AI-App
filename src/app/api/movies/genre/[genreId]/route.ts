import { NextResponse } from "next/server";
import { isGenreChipId } from "@/constants/genreMovies";
import { getGenreMovies } from "@/services/omdb.server";
import { getOMDbErrorMessage, OMDbError } from "@/services/omdb-core";

interface RouteContext {
  params: Promise<{ genreId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
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
