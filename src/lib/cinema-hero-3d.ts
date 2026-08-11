/** Performance & visual tokens for the homepage cinema hero. */
export const CINEMA_HERO_3D = {
  bundle: {
    externalModelsKb: 0,
    lazyChunk: "cinema-hero-canvas",
  },
  canvas: {
    desktopDpr: [1, 1.75] as [number, number],
    mobileDpr: [1, 1.25] as [number, number],
    mobileBreakpointPx: 768,
    maxFramesPerSecond: 60,
    toneMappingExposure: 1.18,
  },
  palette: {
    gold: {
      ring: "#c9a227",
      ringDark: "#6b4f12",
      emissive: "#ffd966",
      accent: "#fff3c4",
      frame: "#1f1608",
    },
    spotlight: {
      ring: "#7c3aed",
      ringDark: "#3b0764",
      emissive: "#a78bfa",
      accent: "#ede9fe",
      frame: "#1a0b2e",
    },
  },
  motion: {
    parallaxStrength: 0.22,
    hoverEmissive: 1.05,
    idleEmissive: 0.42,
    spotlightEmissive: 1.35,
    floatAmplitude: 0.06,
    floatSpeed: 0.85,
  },
  atmosphere: {
    background: "#07060f",
    fogDensity: 0.042,
    fogColor: "#07060f",
  },
  lighting: {
    ambient: { color: "#2e2648", intensity: 0.32 },
    fill: { color: "#93c5fd", intensity: 0.55 },
    key: { color: "#fff1c1", intensity: 1.45 },
    accent: { color: "#c4b5fd", intensity: 0.85 },
    rim: { color: "#faf5ff", intensity: 1.05 },
  },
  pbr: {
    reelRing: { metalness: 0.92, roughness: 0.14, envMapIntensity: 1.35 },
    reelHub: { metalness: 0.95, roughness: 0.12, envMapIntensity: 1.2 },
    reelSpoke: { metalness: 0.72, roughness: 0.22, envMapIntensity: 1.0 },
    filmFrame: { metalness: 0.62, roughness: 0.22, envMapIntensity: 1.1 },
    clapperTop: { metalness: 0.08, roughness: 0.82, envMapIntensity: 0.35 },
    clapperBody: { metalness: 0.04, roughness: 0.58, envMapIntensity: 0.45 },
  },
  postprocessing: {
    bloomIntensity: 0.42,
    bloomThreshold: 0.58,
    bloomSmoothing: 0.85,
  },
  performance: {
    sparkles: { desktop: 14, mobile: 0 },
    environmentResolution: { desktop: 384, mobile: 64 },
    environmentFrames: { desktop: 24, mobile: 1 },
    filmFrames: { desktop: 4, mobile: 1 },
    reelTorus: {
      desktop: { radial: 80, tubular: 32 },
      mobile: { radial: 48, tubular: 16 },
    },
    shadowCircleSegments: { desktop: 64, mobile: 32 },
    backdropSphere: { desktop: 32, mobile: 16 },
    enableFloat: { desktop: true, mobile: false },
    enableParallax: { desktop: true, mobile: false },
    enableFilmFramePulse: { desktop: true, mobile: false },
    frameSkip: { desktop: 1, mobile: 2 },
  },
} as const;

export type CinemaHeroTheme = "gold" | "spotlight";
