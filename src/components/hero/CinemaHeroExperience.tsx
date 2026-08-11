"use client";

import dynamic from "next/dynamic";
import { useLazyInView } from "@/hooks/useLazyInView";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/cn";

const CinemaHeroCanvas = dynamic(
  () => import("@/components/hero/CinemaHeroCanvas"),
  { ssr: false },
);

interface CinemaHeroExperienceProps {
  className?: string;
}

/**
 * Overlays WebGL on the SSR static hero shell. The shell in page.tsx reserves
 * layout space; this component only mounts Three.js after idle + in-view.
 */
export default function CinemaHeroExperience({
  className,
}: CinemaHeroExperienceProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { ref, shouldLoad } = useLazyInView({
    rootMargin: "0px",
    threshold: 0.35,
    idleTimeoutMs: 4000,
  });

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <div ref={ref} className={cn("h-full w-full", className)}>
      {shouldLoad ? <CinemaHeroCanvas className="h-full w-full" /> : null}
    </div>
  );
}
