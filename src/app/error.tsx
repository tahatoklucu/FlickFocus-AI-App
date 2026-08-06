"use client";

import Link from "next/link";
import { useEffect } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-1 flex-col items-center justify-center overflow-hidden bg-zinc-950 px-4 py-20 text-center">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(127,29,29,0.15),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(24,24,27,0.9),rgba(9,9,11,1))]"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-lg">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-red-400/90">
          Technical difficulties
        </p>
        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
          Something went wrong
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          An unexpected error interrupted the show. You can try again or head
          back to the home page.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-w-[160px] items-center justify-center rounded-xl bg-amber-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex min-w-[160px] items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900/60 px-6 py-3 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
