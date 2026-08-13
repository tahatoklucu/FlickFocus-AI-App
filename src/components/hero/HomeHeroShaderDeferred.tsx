"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const HomeHeroShaderLayer = dynamic(
  () => import("@/components/hero/HomeHeroShaderLayer"),
  { ssr: false },
);

/**
 * Defer WebGL hero shader until a real user gesture.
 * Auto idle-load was a major TBT cost in Lighthouse (12s+).
 * CSS aurora in HomeHeroBackdropShell still paints immediately.
 */
export default function HomeHeroShaderDeferred() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) {
      return;
    }

    const activate = () => setReady(true);
    const opts: AddEventListenerOptions = { once: true, passive: true };

    window.addEventListener("pointerdown", activate, opts);
    window.addEventListener("keydown", activate, opts);
    window.addEventListener("touchstart", activate, opts);

    return () => {
      window.removeEventListener("pointerdown", activate);
      window.removeEventListener("keydown", activate);
      window.removeEventListener("touchstart", activate);
    };
  }, [ready]);

  if (!ready) {
    return null;
  }

  return <HomeHeroShaderLayer />;
}
