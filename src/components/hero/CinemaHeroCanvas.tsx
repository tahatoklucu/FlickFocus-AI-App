"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import * as THREE from "three";
import CinemaHeroFallback from "@/components/hero/CinemaHeroFallback";
import CinemaHeroScene from "@/components/hero/CinemaHeroScene";
import { useIsMobileViewport } from "@/hooks/useMediaQuery";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { CINEMA_HERO_3D } from "@/lib/cinema-hero-3d";
import { cn } from "@/lib/cn";

interface CinemaHeroCanvasProps {
  className?: string;
}

export default function CinemaHeroCanvas({ className }: CinemaHeroCanvasProps) {
  const isMobile = useIsMobileViewport(CINEMA_HERO_3D.canvas.mobileBreakpointPx);
  const prefersReducedMotion = usePrefersReducedMotion();
  const enablePremiumFx = !isMobile && !prefersReducedMotion;
  const enableEnvironment = !prefersReducedMotion;

  const dpr = isMobile
    ? CINEMA_HERO_3D.canvas.mobileDpr
    : CINEMA_HERO_3D.canvas.desktopDpr;

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-violet-500/20 bg-neutral-950 shadow-2xl shadow-violet-950/25 ring-1 ring-white/5",
        className,
      )}
    >
      <p className="sr-only">
        Interactive 3D cinema scene. Move the cursor to parallax the film reel, hover
        to highlight it, and click to toggle spotlight colors.
      </p>
      <Canvas
        className="aspect-[4/3] w-full touch-none"
        dpr={dpr}
        gl={{
          antialias: !isMobile,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: CINEMA_HERO_3D.canvas.toneMappingExposure,
        }}
        camera={{ position: [0, 0.08, 3.55], fov: 38 }}
        frameloop="always"
      >
        <Suspense fallback={null}>
          <CinemaHeroScene
            isMobile={isMobile}
            enablePremiumFx={enablePremiumFx}
            enableEnvironment={enableEnvironment}
          />
        </Suspense>
      </Canvas>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-neutral-950/90 to-transparent"
        aria-hidden="true"
      />
      <p
        className="pointer-events-none absolute bottom-2 inset-x-0 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-violet-300/70"
        aria-hidden="true"
      >
        Click reel · Spotlight toggle
      </p>
    </div>
  );
}
