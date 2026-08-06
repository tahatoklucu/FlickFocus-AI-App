import ProfilePageClient from "@/components/ProfilePageClient";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "My Profile",
  description:
    "Manage your FlickFocus account, view saved movie stats, and update your preferences.",
  path: "/profile",
});

export default function ProfilePage() {
  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            My Profile
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Manage your FlickFocus account and view your activity
          </p>
        </header>

        <ProfilePageClient />
      </main>
    </div>
  );
}
