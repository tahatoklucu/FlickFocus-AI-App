"use client";

import HeroShaderBackground from "@/components/hero/HeroShaderBackground";

/** Client boundary for the WebGL hero shader layer. */
export default function HomeHeroShaderLayer() {
  return <HeroShaderBackground className="absolute inset-0" />;
}
