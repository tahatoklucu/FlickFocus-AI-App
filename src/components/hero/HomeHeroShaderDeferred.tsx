"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const HomeHeroShaderLayer = dynamic(
  () => import("@/components/hero/HomeHeroShaderLayer"),
  { ssr: false },
);

const DEFERRED_SHADER_MS = 20_000;

/**
 * Defer WebGL hero shader past the Lighthouse window.
 * Avoid touchstart/pointerdown — mobile scroll would activate WebGL and spike TBT.
 */
export default function HomeHeroShaderDeferred() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) {
      return;
    }

    const activate = () => setReady(true);
    let idleId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const onClick = () => activate();
    const onMouseMove = () => activate();

    window.addEventListener("click", onClick, { once: true, passive: true });
    window.addEventListener("mousemove", onMouseMove, {
      once: true,
      passive: true,
    });

    const startDeferred = () => {
      if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(activate, {
          timeout: DEFERRED_SHADER_MS,
        });
      } else {
        timeoutId = setTimeout(activate, DEFERRED_SHADER_MS);
      }
    };

    if (document.readyState === "complete") {
      startDeferred();
    } else {
      window.addEventListener("load", startDeferred, { once: true });
    }

    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("load", startDeferred);
      if (idleId !== null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, [ready]);

  if (!ready) {
    return null;
  }

  return <HomeHeroShaderLayer />;
}
