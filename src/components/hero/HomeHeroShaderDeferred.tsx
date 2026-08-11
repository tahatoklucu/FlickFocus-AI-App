"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const HomeHeroShaderLayer = dynamic(
  () => import("@/components/hero/HomeHeroShaderLayer"),
  { ssr: false },
);

/** Defer WebGL hero JS until after first paint / idle to protect LCP on slow networks. */
export default function HomeHeroShaderDeferred() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const activate = () => {
      if (!cancelled) {
        setReady(true);
      }
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(activate, { timeout: 4000 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = setTimeout(activate, 2000);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  if (!ready) {
    return null;
  }

  return <HomeHeroShaderLayer />;
}
