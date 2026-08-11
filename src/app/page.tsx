import dynamic from "next/dynamic";
import HomePageHero from "@/components/hero/HomePageHero";
import HomePageClientRoot from "@/components/home/HomePageClientRoot";
import { createPageMetadata } from "@/lib/metadata";
import { getFeaturedMovies } from "@/services/omdb.server";
import type { FeaturedMovie } from "@/types";

const CinemaExperienceSection = dynamic(
  () => import("@/components/hero/CinemaExperienceSection"),
);

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
      <HomePageHero>
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <header className="mb-8 sm:mb-10">
              <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-300">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-violet-400"
                  aria-hidden="true"
                />
                OMDb powered discovery
              </span>
              <h1 className="bg-gradient-to-br from-white via-neutral-100 to-neutral-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl lg:text-5xl">
                Discover Your Next Favorite Film
              </h1>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-neutral-400 sm:text-base">
                Search the catalog, explore curated classics, and save favorites
                to your FlickFocus collection
              </p>
            </header>
          </div>

          <HomePageClientRoot initialFeaturedMovies={featuredMovies} />
        </div>
      </HomePageHero>

      <CinemaExperienceSection />
    </div>
  );
}
