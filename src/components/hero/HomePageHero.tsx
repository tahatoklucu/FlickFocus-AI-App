import type { ReactNode } from "react";
import HomeHeroBackdropShell from "@/components/hero/HomeHeroBackdropShell";
import HomeHeroShaderLayer from "@/components/hero/HomeHeroShaderLayer";

interface HomePageHeroProps {
  children: ReactNode;
}

/**
 * Fullscreen homepage hero — GLSL aurora backdrop with readable content on top.
 * Capstone requirement: custom fragment shader behind the primary hero copy.
 */
export default function HomePageHero({ children }: HomePageHeroProps) {
  return (
    <section
      aria-label="Discover movies"
      className="relative isolate overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0 min-h-[min(100dvh,920px)]">
        <HomeHeroBackdropShell className="min-h-full">
          <HomeHeroShaderLayer />
        </HomeHeroBackdropShell>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-48 bg-gradient-to-b from-transparent via-neutral-950/80 to-neutral-950"
        aria-hidden="true"
      />

      <div className="relative z-10">{children}</div>
    </section>
  );
}
