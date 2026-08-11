"use client";

import dynamic from "next/dynamic";

const CinemaHeroExperience = dynamic(
  () => import("@/components/hero/CinemaHeroExperience"),
  { ssr: false },
);

interface CinemaHeroLazyGateProps {
  className?: string;
}

/** Keeps Three.js / R3F out of the homepage entry chunk. */
export default function CinemaHeroLazyGate({ className }: CinemaHeroLazyGateProps) {
  return <CinemaHeroExperience className={className} />;
}
