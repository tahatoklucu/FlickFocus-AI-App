"use client";

import dynamic from "next/dynamic";
import HomePageLoading from "@/components/HomePageLoading";
import type { FeaturedMovie } from "@/types";

const HomePageClient = dynamic(() => import("@/components/HomePageClient"), {
  ssr: false,
  loading: () => <HomePageLoading />,
});

interface HomePageClientRootProps {
  initialFeaturedMovies: FeaturedMovie[];
}

export default function HomePageClientRoot({
  initialFeaturedMovies,
}: HomePageClientRootProps) {
  return <HomePageClient initialFeaturedMovies={initialFeaturedMovies} />;
}
