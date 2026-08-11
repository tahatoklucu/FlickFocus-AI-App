"use client";

import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { CINEMA_HERO_3D } from "@/lib/hero/cinema-hero-3d";

export default function CinemaHeroEffects() {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom
        intensity={CINEMA_HERO_3D.postprocessing.bloomIntensity}
        luminanceThreshold={CINEMA_HERO_3D.postprocessing.bloomThreshold}
        luminanceSmoothing={CINEMA_HERO_3D.postprocessing.bloomSmoothing}
        mipmapBlur
      />
    </EffectComposer>
  );
}
