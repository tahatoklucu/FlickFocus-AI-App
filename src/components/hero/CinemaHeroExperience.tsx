"use client";

import dynamic from "next/dynamic";
import CinemaHeroFallback from "@/components/hero/CinemaHeroFallback";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/cn";

const CinemaHeroCanvas = dynamic(
  () => import("@/components/hero/CinemaHeroCanvas"),
  {
    ssr: false,
    loading: () => <CinemaHeroFallback loading />,
  },
);

interface CinemaHeroExperienceProps {
  className?: string;
}

export default function CinemaHeroExperience({
  className,
}: CinemaHeroExperienceProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    return <CinemaHeroFallback className={className} />;
  }

  return <CinemaHeroCanvas className={className} />;
}
