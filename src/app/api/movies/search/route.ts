import { NextResponse } from "next/server";
import { API_LIMITS, clampSearchQuery } from "@/lib/api/api-limits";
import { enforceRateLimit } from "@/lib/api/api-rate-limit";
import { searchMovies } from "@/services/omdb.server";
import { getOMDbErrorMessage } from "@/services/omdb-core";

export const maxDuration = 15;

export async function GET(request: Request) {
  const rateLimited = enforceRateLimit(request, "api");
  if (rateLimited) {
    return rateLimited;
  }

  const { searchParams } = new URL(request.url);
  const query = clampSearchQuery(searchParams.get("q") ?? "");
  const page = Number(searchParams.get("page") ?? "1");
  const type = (searchParams.get("type") ?? "movie") as "movie" | "series" | "episode";

  if (!query) {
    return NextResponse.json(
      { error: "A search query is required." },
      { status: 400 },
    );
  }

  if (!Number.isFinite(page) || page < 1 || page > API_LIMITS.search.maxPage) {
    return NextResponse.json({ error: "Invalid page number." }, { status: 400 });
  }

  if (!["movie", "series", "episode"].includes(type)) {
    return NextResponse.json({ error: "Invalid type." }, { status: 400 });
  }

  try {
    const results = await searchMovies({ query, page, type });

    return NextResponse.json(results, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: getOMDbErrorMessage(error) },
      { status: 502 },
    );
  }
}
