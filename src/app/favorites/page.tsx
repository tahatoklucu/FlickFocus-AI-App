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
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            My Favorites
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Your FlickFocus collection, synced in real time
          </p>
        </header>

        <FavoritesPageClient />
      </main>
    </div>
  );
}
