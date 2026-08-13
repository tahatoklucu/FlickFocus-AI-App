"use client";

import HomePageClient from "@/components/home/HomePageClient";
import type { FeaturedMovie } from "@/types";

interface HomePageClientRootProps {
  initialFeaturedMovies: FeaturedMovie[];
}

/** Static client import so featured posters SSR into the initial HTML (LCP discovery). */
export default function HomePageClientRoot({
  initialFeaturedMovies,
}: HomePageClientRootProps) {
  return <HomePageClient initialFeaturedMovies={initialFeaturedMovies} />;
}
