import HomePageClient from "@/components/HomePageClient";
import { createPageMetadata } from "@/lib/metadata";
import { getFeaturedMovies } from "@/services/omdb.server";
import type { MovieSearchResult } from "@/types";

export const metadata = createPageMetadata({
  title: "Discover & Save Your Favorite Movies",
  description:
    "Search the OMDb catalog, explore featured classics, and build your personal cinematic collection with FlickFocus.",
  path: "/",
});

export default async function HomePage() {
  let featuredMovies: MovieSearchResult[] = [];

  try {
    featuredMovies = await getFeaturedMovies();
  } catch {
    featuredMovies = [];
  }

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <header className="mb-6 text-center sm:mb-10">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl lg:text-4xl">
            Discover Your Next Favorite Film
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 sm:text-base">
            Search the OMDb catalog and save favorites to your FlickFocus
            collection
          </p>
        </header>

        <HomePageClient initialFeaturedMovies={featuredMovies} />
      </div>
    </div>
  );
}
