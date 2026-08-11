import { cn } from "@/lib/cn";

interface CinemaHeroFallbackProps {
  className?: string;
  /** When true, fills a pre-sized parent shell (homepage hero slot). */
  embedded?: boolean;
}

/** SSR-safe static hero — CSS illustration; reserves space before WebGL loads. */
export default function CinemaHeroFallback({
  className,
  embedded = false,
}: CinemaHeroFallbackProps) {
  return (
    <figure
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-2xl border border-violet-500/15 bg-gradient-to-br from-neutral-900 via-neutral-950 to-violet-950/40 shadow-2xl shadow-violet-950/20 ring-1 ring-white/5",
        embedded
          ? "h-full w-full"
          : "mx-auto aspect-[4/3] w-full max-w-md",
        className,
      )}
      aria-label="Cinematic film reel illustration"
    >
      <div className="cinema-hero-fallback__glow pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="relative flex flex-col items-center gap-4 px-6 py-8">
        <div className="cinema-hero-fallback__reel" aria-hidden="true">
          <div className="cinema-hero-fallback__reel-hub" />
          <div className="cinema-hero-fallback__reel-ring" />
          {Array.from({ length: 8 }).map((_, index) => (
            <span
              key={index}
              className="cinema-hero-fallback__reel-spoke"
              style={{ transform: `rotate(${index * 45}deg)` }}
            />
          ))}
        </div>

        <div className="cinema-hero-fallback__clapper" aria-hidden="true">
          <span className="cinema-hero-fallback__clapper-top" />
          <span className="cinema-hero-fallback__clapper-body" />
        </div>
      </div>

      <figcaption className="sr-only">
        Static cinema hero — interactive 3D scene loads on demand when motion is allowed.
      </figcaption>
    </figure>
  );
}
