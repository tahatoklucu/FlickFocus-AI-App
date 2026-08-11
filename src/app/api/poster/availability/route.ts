import { NextResponse } from "next/server";
import { isPosterAvailable } from "@/lib/poster-availability.server";
import { isValidPosterUrl } from "@/lib/poster-url";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!isValidPosterUrl(url)) {
    return NextResponse.json(
      { available: false },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      },
    );
  }

  const available = await isPosterAvailable(url);

  return NextResponse.json(
    { available },
    {
      headers: {
        "Cache-Control": available
          ? "public, s-maxage=86400, stale-while-revalidate=604800"
          : "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
