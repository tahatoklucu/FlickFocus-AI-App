"use client";

import CinemaHeroSlot from "@/components/hero/CinemaHeroSlot";
import HomeHeroBackdropShell from "@/components/hero/HomeHeroBackdropShell";
import HomeHeroShaderLayer from "@/components/hero/HomeHeroShaderLayer";

/**
 * Dedicated showcase for the interactive 3D cinema hero + GLSL backdrop.
 * Placed below search/results so discovery stays focused above the fold.
 */
export default function CinemaExperienceSection() {
  return (
    <section
      aria-labelledby="cinema-experience-heading"
      className="relative mt-4 border-t border-neutral-800/80 sm:mt-8"
    >
      <div className="relative overflow-hidden">
        <HomeHeroBackdropShell>
          <HomeHeroShaderLayer />
        </HomeHeroBackdropShell>

        <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1fr)_min(420px,42%)] lg:items-center lg:gap-12 lg:px-8 lg:py-20">
          <div className="max-w-xl text-center lg:text-left">
            <span className="mb-3 inline-flex items-center rounded-full border border-violet-500/25 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-violet-300">
              Interactive 3D
            </span>
            <h2
              id="cinema-experience-heading"
              className="text-2xl font-bold tracking-tight text-neutral-50 sm:text-3xl"
            >
              Cinema Hero Experience
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-400 sm:text-base">
              A procedural WebGL reel built with Three.js — hover, click, and
              explore the spotlight. Loads only when this section enters view to
              keep the homepage fast.
            </p>
            <ul className="mt-5 space-y-2 text-left text-sm text-neutral-500">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" aria-hidden="true" />
                Mouse-reactive GLSL aurora backdrop
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" aria-hidden="true" />
                Click the reel to toggle gold / violet lighting
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" aria-hidden="true" />
                Respects reduced motion — static fallback when enabled
              </li>
            </ul>
          </div>

          <div className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
            <CinemaHeroSlot />
          </div>
        </div>
      </div>
    </section>
  );
}
