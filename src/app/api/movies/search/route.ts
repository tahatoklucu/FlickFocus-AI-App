import { NextResponse } from "next/server";
import { searchMovies } from "@/services/omdb.server";
import { getOMDbErrorMessage } from "@/services/omdb-core";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const type = (searchParams.get("type") ?? "movie") as "movie" | "series" | "episode";

  if (!query.trim()) {
    return NextResponse.json(
      { error: "A search query is required." },
      { status: 400 },
    );
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
