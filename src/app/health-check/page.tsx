import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/metadata";
import { getOMDbErrorMessage } from "@/services/omdb-core";
import { searchMovies } from "@/services/omdb.server";
import type { SearchResponse } from "@/types";

export const metadata = createPageMetadata({
  title: "Health Check",
  description:
    "Verify that FlickFocus can reach the OMDb API and fetch movie data.",
  path: "/health-check",
});

const HEALTH_CHECK_QUERY = "Matrix";

type HealthCheckResult =
  | { status: "ok"; response: SearchResponse }
  | { status: "error"; message: string };

async function runHealthCheck(): Promise<HealthCheckResult> {
  try {
    const response = await searchMovies({ query: HEALTH_CHECK_QUERY });
    return { status: "ok", response };
  } catch (error) {
    return {
      status: "error",
      message: getOMDbErrorMessage(
        error,
        "Health check failed. Unable to verify OMDb connectivity.",
      ),
    };
  }
}

function HealthCheckLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            Health Check
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            OMDb API connectivity test for FlickFocus
          </p>
        </header>
        {children}
      </main>
    </div>
  );
}

function HealthCheckSuccess({ response }: { response: SearchResponse }) {
  const sample = response.Search?.[0];

  return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm dark:border-emerald-900/50 dark:bg-zinc-900 sm:p-8">
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-3 w-3 rounded-full bg-emerald-500"
          aria-hidden="true"
        />
        <h2 className="text-xl font-semibold text-emerald-700 dark:text-emerald-300">
          System Status: OK
        </h2>
      </div>

      <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
        Successfully fetched data from the OMDb API using the search term{" "}
        <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
          {HEALTH_CHECK_QUERY}
        </code>
        .
      </p>

      <dl className="mt-6 space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Total results
          </dt>
          <dd className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {response.totalResults ?? "0"}
          </dd>
        </div>

        {sample ? (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Sample result
            </dt>
            <dd className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
              <span className="font-semibold">{sample.Title}</span>
              {sample.Year ? ` (${sample.Year})` : null}
              {" · "}
              <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                {sample.imdbID}
              </span>
            </dd>
          </div>
        ) : (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Sample result
            </dt>
            <dd className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              API responded successfully, but no movies were returned for this
              query.
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}

function HealthCheckFailure({ message }: { message: string }) {
  return (
    <section
      role="alert"
      className="mx-auto max-w-2xl rounded-2xl border border-red-200 bg-white p-6 shadow-sm dark:border-red-900/50 dark:bg-zinc-900 sm:p-8"
    >
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-3 w-3 rounded-full bg-red-500"
          aria-hidden="true"
        />
        <h2 className="text-xl font-semibold text-red-700 dark:text-red-300">
          System Status: Error
        </h2>
      </div>

      <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
        The health check could not reach the OMDb API or received an invalid
        response.
      </p>

      <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
        {message}
      </p>
    </section>
  );
}

export default async function HealthCheckPage() {
  const result = await runHealthCheck();

  return (
    <HealthCheckLayout>
      {result.status === "ok" ? (
        <HealthCheckSuccess response={result.response} />
      ) : (
        <HealthCheckFailure message={result.message} />
      )}
    </HealthCheckLayout>
  );
}
