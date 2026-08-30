import type { MetadataRoute } from "next";
import { FEATURED_MOVIE_IDS } from "@/constants/featuredMovies";
import { GENRE_MOVIE_CANDIDATES } from "@/constants/genreMovies";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/chat`, lastModified, changeFrequency: "monthly", priority: 0.6 },
  ];

  // Curated catalog entries are the only movie pages we can enumerate without
  // crawling OMDb; the rest are reachable through search.
  const movieIds = new Set<string>([
    ...FEATURED_MOVIE_IDS,
    ...Object.values(GENRE_MOVIE_CANDIDATES).flat(),
  ]);

  const movieRoutes: MetadataRoute.Sitemap = [...movieIds].map((imdbId) => ({
    url: `${SITE_URL}/movie/${imdbId}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...movieRoutes];
}
