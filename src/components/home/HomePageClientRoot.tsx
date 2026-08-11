"use client";

import dynamic from "next/dynamic";
import HomePageLoading from "@/components/home/HomePageLoading";
import type { FeaturedMovie } from "@/types";

const HomePageClient = dynamic(() => import("@/components/home/HomePageClient"), {
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
