import dynamic from "next/dynamic";
import CinemaHeroSlot from "@/components/hero/CinemaHeroSlot";
import PageHeroGlow from "@/components/PageHeroGlow";
import { createPageMetadata } from "@/lib/metadata";
import { getFeaturedMovies } from "@/services/omdb.server";
import type { FeaturedMovie } from "@/types";

const HomePageClient = dynamic(() => import("@/components/HomePageClient"));

export const metadata = createPageMetadata({
  title: "Discover & Save Your Favorite Movies",
  description:
    "Search the OMDb catalog, explore featured classics, and build your personal cinematic collection with FlickFocus.",
  path: "/",
});

export default async function HomePage() {
  let featuredMovies: FeaturedMovie[] = [];

  try {
    featuredMovies = await getFeaturedMovies();
  } catch {
    featuredMovies = [];
  }

  return (
    <div className="relative min-h-full bg-neutral-950">
      <PageHeroGlow size="lg" />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <header className="mx-auto mb-8 grid max-w-5xl gap-8 lg:mb-10 lg:grid-cols-[minmax(0,1fr)_min(420px,38vw)] lg:items-center lg:gap-10">
          <div className="max-w-2xl text-center lg:text-left">
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-300">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400" aria-hidden="true" />
              OMDb powered discovery
            </span>
            <h1 className="bg-gradient-to-br from-white via-neutral-100 to-neutral-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl lg:text-5xl">
              Discover Your Next Favorite Film
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-neutral-400 sm:text-base">
              Search the catalog, explore curated classics, and save favorites to
              your FlickFocus collection
            </p>
          </div>

          <CinemaHeroSlot />
        </header>

        <HomePageClient initialFeaturedMovies={featuredMovies} />
      </div>
    </div>
  );
}
