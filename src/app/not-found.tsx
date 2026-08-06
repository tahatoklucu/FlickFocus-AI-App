import Link from "next/link";
import { createPageMetadata } from "@/lib/metadata";
import { SITE_NAME } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "Page Not Found",
  description: `The page you requested could not be found on ${SITE_NAME}.`,
  path: "/404",
});

export default function NotFound() {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-1 flex-col items-center justify-center overflow-hidden bg-zinc-950 px-4 py-20 text-center">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,53,15,0.18),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(24,24,27,0.9),rgba(9,9,11,1))]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, transparent, transparent 28px, rgba(255,255,255,0.9) 28px, rgba(255,255,255,0.9) 32px)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-lg">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-amber-500/90">
          Scene missing
        </p>
        <h1 className="text-7xl font-black tracking-tighter text-white sm:text-8xl">
          404
        </h1>
        <p className="mt-4 text-xl font-semibold text-zinc-100 sm:text-2xl">
          This page isn&apos;t in our catalog
        </p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          The route you requested doesn&apos;t exist — it may have been moved,
          deleted, or never made it past the cutting room floor.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-w-[160px] items-center justify-center rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
          >
            Back to Home
          </Link>
          <Link
            href="/favorites"
            className="inline-flex min-w-[160px] items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900/60 px-6 py-3 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800"
          >
            My Favorites
          </Link>
        </div>
      </div>
    </div>
  );
}
