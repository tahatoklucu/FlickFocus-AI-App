"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const HomeHeroShaderLayer = dynamic(
  () => import("@/components/hero/HomeHeroShaderLayer"),
  { ssr: false },
);

/**
 * The animated hero is decorative, so it waits for a real signal of engagement
 * rather than a timer: the static gradient shell stands in until then. Avoid
 * touchstart/pointerdown — mobile scroll fires those and would spike TBT.
 */
export default function HomeHeroShaderDeferred() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) {
      return;
    }

    const activate = () => setReady(true);
    const onClick = () => activate();
    const onMouseMove = () => activate();

    window.addEventListener("click", onClick, { once: true, passive: true });
    window.addEventListener("mousemove", onMouseMove, {
      once: true,
      passive: true,
    });

    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [ready]);

  if (!ready) {
    return null;
  }

  return <HomeHeroShaderLayer />;
}
