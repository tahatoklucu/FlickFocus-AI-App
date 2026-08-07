"use client";

import Link from "next/link";
import { useEffect } from "react";
import Button from "@/components/ui/Button";
import { buttonClass } from "@/lib/button-styles";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="relative flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center overflow-hidden bg-zinc-950 px-4 py-12 text-center sm:py-20">
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
          <Button
            type="button"
            variant="amber"
            onClick={reset}
            className="min-w-[160px]"
          >
            Try again
          </Button>
          <Link
            href="/"
            className={buttonClass("secondary", "md", "min-w-[160px] bg-zinc-900/60 text-zinc-200 dark:bg-zinc-900/60")}
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
