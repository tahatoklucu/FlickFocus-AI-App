import StatsPageClient from "@/components/stats/StatsPageClient";
import PageHeroGlow from "@/components/layout/PageHeroGlow";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "My Stats",
  description:
    "See your FlickFocus viewing stats: watched count, personal ratings, and taste trends.",
  path: "/stats",
});

export default function StatsPage() {
  return (
    <div className="relative min-h-full bg-neutral-950">
      <PageHeroGlow subdued />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <header className="mx-auto mb-8 max-w-xl text-center sm:mb-10">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-300">
            Your taste
          </span>
          <h1 className="bg-gradient-to-br from-white via-neutral-100 to-neutral-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
            My Stats
          </h1>
          <p className="mt-3 text-sm text-neutral-400 sm:text-base">
            A snapshot of what you watch, rate, and keep in your library
          </p>
        </header>

        <StatsPageClient />
      </div>
    </div>
  );
}
