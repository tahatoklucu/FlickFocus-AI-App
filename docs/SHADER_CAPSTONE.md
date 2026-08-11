# GLSL Hero Shader — Capstone Deliverable

**Project:** FlickFocus  
**Live URL:** Set `NEXT_PUBLIC_APP_URL` in production (e.g. your Vercel deployment). Local dev: `http://localhost:3000`

---

## 1. What Was Built

A **custom GLSL fragment shader** renders as a **fullscreen hero backdrop** on the FlickFocus homepage (`/`). Headline, description, search bar, and genre chips sit on top with readability scrims and vignette tuning in the shader.

| Requirement | Implementation |
| --- | --- |
| Custom fragment shader | `src/lib/hero/hero-shader.ts` — cinema aurora (FBM noise + violet/gold palette) |
| `u_time` | Elapsed seconds; drives drifting aurora layers |
| `u_resolution` | Canvas size in physical pixels (aspect-correct UVs) |
| `u_mouse` | Pointer position in canvas space; eases toward target each frame |
| Readable text | Radial vignette, top fade, `HeroShaderScrim` gradient overlay |
| DPR cap | `getHeroShaderDpr()` — max **1.25** mobile, **1.75** desktop |
| Tab hidden pause | `visibilitychange` cancels RAF; time offset excludes hidden duration |
| Reduced motion | `prefers-reduced-motion: reduce` → WebGL skipped; static CSS gradient shell |

---

## 2. Shader Source

**File:** `src/lib/hero/hero-shader.ts`

- `HERO_SHADER_VERTEX` — full-screen triangle, passes UVs  
- `HERO_SHADER_FRAGMENT` — procedural aurora with hash/noise/fbm helpers  
- Inline comments explain each block (coordinates, mouse parallax, color mix, vignette)

**Runtime:** `src/components/hero/HeroShaderBackground.tsx` — WebGL program setup, uniforms, resize, pointer, visibility pause.

**Layout:** `src/components/hero/HomePageHero.tsx` — fullscreen hero shell on the homepage.

---

## 3. Performance & Fallback Description

### Performance

1. **Device pixel ratio cap** — Retina fill-rate is limited via `getHeroShaderDpr()` so the canvas never renders at full 3× DPR on high-density phones.
2. **Tab visibility** — When `document.visibilityState !== "visible"`, the animation loop stops and elapsed time pauses so background tabs do not waste GPU/battery.
3. **Low-power WebGL context** — `powerPreference: "low-power"` where supported.
4. **No per-frame buffer uploads** — Static full-screen triangle; only three uniforms update per frame.

### Accessibility fallback (`prefers-reduced-motion`)

When the user enables **Reduce motion** in OS settings:

1. `usePrefersReducedMotion()` returns `true`.
2. `HeroShaderBackground` **does not create a WebGL context** or start RAF.
3. `HomeHeroBackdropShell` (SSR-safe) renders a **static CSS gradient** (violet + gold radial glows on `neutral-950`).
4. `HeroShaderScrim` still applies so text contrast matches the animated path.

This satisfies the assignment requirement for a static frame/gradient fallback without motion.

---

## 4. File Map

| File | Role |
| --- | --- |
| `src/lib/hero/hero-shader.ts` | GLSL source + DPR helper |
| `src/components/hero/HeroShaderBackground.tsx` | WebGL canvas, uniforms, lifecycle |
| `src/components/hero/HomeHeroBackdropShell.tsx` | SSR static gradient (fallback base) |
| `src/components/hero/HomeHeroShaderLayer.tsx` | Client boundary for shader |
| `src/components/hero/HomePageHero.tsx` | Fullscreen homepage hero wrapper |
| `src/app/page.tsx` | Wires hero + search + featured movies |
| `src/hooks/usePrefersReducedMotion.ts` | Motion preference hook |

---

## 5. Deployment (Live URL)

```bash
npm run build
# Deploy to Vercel (or your host), then set:
# NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

Submit the production homepage URL where the hero shader is visible above the fold.

---

*Capstone: Shaders for Design Engineers — GLSL fullscreen hero integration for FlickFocus.*
