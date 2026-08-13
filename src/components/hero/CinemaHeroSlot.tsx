"use client";

import { useState } from "react";
import CinemaHeroFallback from "@/components/hero/CinemaHeroFallback";
import CinemaHeroLazyGate from "@/components/hero/CinemaHeroLazyGate";

/**
 * Three.js canvas only after an explicit click — scrolling into view alone
 * still pulled the heavy chunk during Lighthouse and spiked TBT.
 */
export default function CinemaHeroSlot() {
  const [enabled, setEnabled] = useState(false);

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-neutral-900 ring-1 ring-white/10">
      <CinemaHeroFallback embedded className="absolute inset-0" />
      {enabled ? (
        <CinemaHeroLazyGate className="absolute inset-0" />
      ) : (
        <button
          type="button"
          onClick={() => setEnabled(true)}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-neutral-950/45 px-4 text-center backdrop-blur-[2px] transition hover:bg-neutral-950/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-400/50"
        >
          <span className="rounded-full border border-violet-400/40 bg-violet-500/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-200">
            Interactive 3D
          </span>
          <span className="text-sm font-semibold text-neutral-50">
            Load cinematic experience
          </span>
          <span className="max-w-[16rem] text-xs text-neutral-400">
            Starts WebGL on demand so the homepage stays fast
          </span>
        </button>
      )}
    </div>
  );
}
