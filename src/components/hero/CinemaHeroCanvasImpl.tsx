"use client";

import { Canvas } from "@react-three/fiber";
import dynamic from "next/dynamic";
import { Suspense, useEffect, useRef, useState } from "react";
import { ACESFilmicToneMapping } from "three";
import { useIsMobileViewport } from "@/hooks/useMediaQuery";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { CINEMA_HERO_3D } from "@/lib/cinema-hero-3d";
import { cn } from "@/lib/cn";

const CinemaHeroScene = dynamic(
  () => import("@/components/hero/CinemaHeroScene"),
  { ssr: false },
);

interface CinemaHeroCanvasImplProps {
  className?: string;
}

export default function CinemaHeroCanvasImpl({ className }: CinemaHeroCanvasImplProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const isMobile = useIsMobileViewport(CINEMA_HERO_3D.canvas.mobileBreakpointPx);
  const prefersReducedMotion = usePrefersReducedMotion();
  const enablePremiumFx = !isMobile && !prefersReducedMotion;
  const enableEnvironment = enablePremiumFx;

  const dpr = isMobile
    ? CINEMA_HERO_3D.canvas.mobileDpr
    : CINEMA_HERO_3D.canvas.desktopDpr;

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.08, rootMargin: "40px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-full w-full overflow-hidden rounded-2xl border border-violet-500/20 bg-neutral-950 shadow-2xl shadow-violet-950/25 ring-1 ring-white/5",
        className,
      )}
    >
      <p className="sr-only">
        Interactive 3D cinema scene. Move the cursor to parallax the film reel, hover
        to highlight it, and click to toggle spotlight colors.
      </p>
      <Canvas
        className="h-full w-full touch-none"
        dpr={dpr}
        gl={{
          antialias: !isMobile,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: ACESFilmicToneMapping,
          toneMappingExposure: CINEMA_HERO_3D.canvas.toneMappingExposure,
        }}
        camera={{ position: [0, 0.08, 3.55], fov: 38 }}
        frameloop={isVisible ? "always" : "never"}
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
