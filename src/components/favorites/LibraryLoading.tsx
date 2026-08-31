/** Placeholder shown while the client resolves which shelf the URL asks for. */
export default function LibraryLoading() {
  return (
    <div aria-hidden="true">
      <div className="mb-6 flex flex-wrap justify-center gap-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-10 w-32 rounded-full border border-neutral-800 bg-neutral-900/70"
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="aspect-[2/3] rounded-xl border border-neutral-800/90 bg-neutral-900/50"
          />
        ))}
      </div>
    </div>
  );
}
