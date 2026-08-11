export default function HomePageLoading() {
  return (
    <>
      <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-14">
        <div className="flex items-stretch gap-2 sm:gap-3">
          <div className="min-h-11 flex-1 rounded-xl border border-neutral-800 bg-neutral-900/60 sm:min-h-12" />
          <div className="min-h-11 w-24 shrink-0 rounded-xl bg-violet-500/30 sm:min-h-12 sm:w-28" />
        </div>
        <div className="mt-4 flex flex-wrap justify-start gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-7 w-16 rounded-full border border-neutral-800 bg-neutral-900/60"
            />
          ))}
        </div>
      </div>

      <section className="scroll-mt-24">
        <div className="mb-6">
          <div className="mb-2 h-5 w-28 rounded-full bg-violet-500/15" />
          <div className="h-8 w-48 rounded-lg bg-neutral-800/80" />
          <div className="mt-2 h-4 w-72 max-w-full rounded bg-neutral-900/80" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              key={index}
              className="aspect-[2/3] rounded-xl border border-neutral-800/90 bg-neutral-900/50"
            />
          ))}
        </div>
      </section>
    </>
  );
}
