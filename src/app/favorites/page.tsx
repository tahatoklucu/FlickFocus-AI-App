import FavoritesPageClient from "@/components/favorites/FavoritesPageClient";
import PageHeroGlow from "@/components/layout/PageHeroGlow";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "My Favorites",
  description:
    "View and manage your saved movies on FlickFocus. Your personal watchlist, synced in real time.",
  path: "/favorites",
});

export default function FavoritesPage() {
  return (
    <div className="relative flex flex-1 flex-col bg-neutral-950">
      <PageHeroGlow subdued />

      <div className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <header className="mx-auto mb-8 max-w-xl text-center sm:mb-10">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-300">
            Your collection
          </span>
          <h1 className="bg-gradient-to-br from-white via-neutral-100 to-neutral-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
            My Favorites
          </h1>
          <p className="mt-3 text-sm text-neutral-400 sm:text-base">
            Your FlickFocus watchlist, synced in real time
          </p>
        </header>

        <FavoritesPageClient />
      </div>
    </div>
  );
}
