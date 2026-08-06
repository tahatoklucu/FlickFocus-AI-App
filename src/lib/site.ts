export const SITE_NAME = "FlickFocus";

export const SITE_TITLE_DEFAULT =
  "FlickFocus — Discover & Save Your Favorite Movies";

export const SITE_DESCRIPTION =
  "Discover movies, explore detailed ratings, and build your personal cinematic collection with FlickFocus.";

export const SITE_KEYWORDS = [
  "movies",
  "film search",
  "movie database",
  "watchlists",
  "favorites",
  "OMDb",
  "React",
  "Next.js",
  "FlickFocus",
];

export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
).replace(/\/$/, "");
