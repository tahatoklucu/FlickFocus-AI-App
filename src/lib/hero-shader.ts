/** Full-screen hero fragment shader — cinema aurora with mouse-reactive flow. */

export const HERO_SHADER_VERTEX = /* glsl */ `
  attribute vec2 a_position;
  varying vec2 v_uv;

  void main() {
    // Pass normalized clip-space coords as UVs (0–1 across the canvas).
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

export const HERO_SHADER_FRAGMENT = /* glsl */ `
  precision highp float;

  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;

  varying vec2 v_uv;

  // Cheap hash for procedural noise layers.
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  // Smooth value noise built from the hash above.
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  // Fractional Brownian motion — stacked noise for organic motion.
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p *= 2.1;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    // Aspect-correct coordinates centered on the canvas.
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
    vec2 mouse = (u_mouse - 0.5 * u_resolution) / u_resolution.y;

    // Mouse pulls the flow field — subtle parallax, not a spotlight.
    vec2 flow = uv + mouse * 0.18;
    float t = u_time * 0.22;

    // Two drifting FBM layers create aurora-like ribbons.
    float waveA = fbm(flow * 1.6 + vec2(t * 0.35, t * 0.18));
    float waveB = fbm(flow * 2.4 - vec2(t * 0.28, t * 0.42) + mouse * 0.4);
    float blend = smoothstep(0.25, 0.85, waveA * 0.65 + waveB * 0.35);

    // FlickFocus palette: deep neutral base + violet + warm gold accent.
    vec3 base = vec3(0.04, 0.04, 0.06);
    vec3 violet = vec3(0.38, 0.18, 0.72);
    vec3 gold = vec3(0.72, 0.52, 0.14);
    vec3 color = mix(base, mix(violet, gold, waveB), blend * 0.42);

    // Radial vignette keeps edges dark so headline text stays readable.
    float vignette = 1.0 - smoothstep(0.55, 1.35, length(uv * vec2(0.9, 1.0)));
    color *= 0.55 + 0.45 * vignette;

    // Top fade — extra dimming under the hero copy column.
    color *= smoothstep(-0.15, 0.55, v_uv.y) * 0.85 + 0.15;

    gl_FragColor = vec4(color, 1.0);
  }
`;

/** Cap device pixel ratio to limit fill-rate cost on retina displays. */
export function getHeroShaderDpr(): number {
  if (typeof window === "undefined") {
    return 1;
  }
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const cap = isMobile ? 1.25 : 1.75;
  return Math.min(window.devicePixelRatio || 1, cap);
}
