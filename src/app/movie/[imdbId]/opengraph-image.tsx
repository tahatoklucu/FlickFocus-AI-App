import { ImageResponse } from "next/og";
import { isValidImdbIdParam } from "@/lib/api/api-limits";
import { isValidPosterUrl } from "@/lib/poster/poster-url";
import { SITE_NAME } from "@/lib/site";
import { getMovieById } from "@/services/omdb.server";

export const alt = "Movie details on FlickFocus";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function cleanValue(value: string | undefined): string | null {
  return !value || value === "N/A" ? null : value;
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ imdbId: string }>;
}) {
  const { imdbId } = await params;

  const movie = isValidImdbIdParam(imdbId)
    ? await getMovieById(imdbId).catch(() => null)
    : null;

  const title = movie?.Title ?? SITE_NAME;
  const year = cleanValue(movie?.Year);
  const genre = cleanValue(movie?.Genre);
  const rating = cleanValue(movie?.imdbRating);
  const poster = movie && isValidPosterUrl(movie.Poster) ? movie.Poster : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #0a0a0a 0%, #1c1033 55%, #0a0a0a 100%)",
          color: "white",
          padding: 64,
          gap: 56,
          alignItems: "center",
          fontFamily: "sans-serif",
        }}
      >
        {poster ? (
          <img
            src={poster}
            alt=""
            width={320}
            height={480}
            style={{
              width: 320,
              height: 480,
              objectFit: "cover",
              borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          />
        ) : null}

        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div
            style={{
              fontSize: 24,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#c4b5fd",
              marginBottom: 24,
            }}
          >
            {SITE_NAME}
          </div>

          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.1 }}>{title}</div>

          {year ? (
            <div style={{ fontSize: 34, color: "#d4d4d4", marginTop: 20 }}>{year}</div>
          ) : null}

          {genre ? (
            <div style={{ fontSize: 28, color: "#a3a3a3", marginTop: 14 }}>{genre}</div>
          ) : null}

          {rating ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 36,
                fontSize: 34,
                fontWeight: 700,
                color: "#fcd34d",
              }}
            >
              {/* Satori's default font has no star glyph, so use a label. */}
              <span>IMDb {rating}/10</span>
            </div>
          ) : null}
        </div>
      </div>
    ),
    size,
  );
}
