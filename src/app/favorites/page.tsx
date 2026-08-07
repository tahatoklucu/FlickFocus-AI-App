import FavoritesPageClient from "@/components/FavoritesPageClient";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "My Favorites",
  description:
    "View and manage your saved movies on FlickFocus. Your personal watchlist, synced in real time.",
  path: "/favorites",
});

export default function FavoritesPage() {
  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <header className="mb-6 text-center sm:mb-10">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl lg:text-4xl">
            My Favorites
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 sm:text-base">
            Your FlickFocus collection, synced in real time
          </p>
        </header>

        <FavoritesPageClient />
      </div>
    </div>
  );
}
