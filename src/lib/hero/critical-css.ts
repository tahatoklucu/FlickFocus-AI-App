/** Minimal above-the-fold rules — inlined in layout to unblock first paint. */
export const CRITICAL_CSS = `
html{min-height:100dvh;text-size-adjust:100%}
body{margin:0;min-height:100dvh;background:#0a0a0a;color:#f5f5f5;font-family:var(--font-geist-sans,system-ui,-apple-system,sans-serif);line-height:1.5;-webkit-font-smoothing:antialiased}
.flex{display:flex}.flex-col{flex-direction:column}.min-h-dvh{min-height:100dvh}.bg-neutral-950{background-color:#0a0a0a}.text-neutral-100{color:#f5f5f5}
.relative{position:relative}.absolute{position:absolute}.inset-0{inset:0}.aspect-\\[4\\/3\\]{aspect-ratio:4/3}.w-full{width:100%}
.skip-link{position:absolute;left:-9999px;top:.75rem;z-index:200}
.cinema-hero-fallback__glow{background:radial-gradient(circle at 50% 35%,rgba(139,92,246,.22),transparent 58%),radial-gradient(circle at 20% 80%,rgba(201,162,39,.12),transparent 45%)}
.cinema-hero-fallback__reel{position:relative;width:7.5rem;height:7.5rem}
.cinema-hero-fallback__reel-ring{position:absolute;inset:0;border-radius:9999px;border:.85rem solid #3d2e14;box-shadow:inset 0 0 0 2px rgba(245,230,184,.25),0 0 24px rgba(139,92,246,.18)}
`.trim();
