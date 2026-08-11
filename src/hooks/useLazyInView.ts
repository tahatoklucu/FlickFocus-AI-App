"use client";

import { useEffect, useRef, useState } from "react";

interface UseLazyInViewOptions {
  rootMargin?: string;
  threshold?: number | number[];
  /** Max ms to wait for idle before forcing load (default 2500). */
  idleTimeoutMs?: number;
  /** Extra delay after intersection before load (default 0). */
  loadDelayMs?: number;
}

function scheduleIdle(callback: () => void, timeoutMs: number) {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    window.requestIdleCallback(callback, { timeout: timeoutMs });
    return;
  }

  setTimeout(callback, Math.min(timeoutMs, 150));
}

/** Defer heavy work until an element intersects the viewport (post-idle when possible). */
export function useLazyInView(options: UseLazyInViewOptions = {}) {
  const {
    rootMargin = "80px",
    threshold = 0.12,
    idleTimeoutMs = 2500,
    loadDelayMs = 0,
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (shouldLoad) {
      return;
    }

    const node = ref.current;
    if (!node) {
      return;
    }

    let cancelled = false;

    const triggerLoad = () => {
      if (cancelled) {
        return;
      }

      const start = () => {
        if (!cancelled) {
          setShouldLoad(true);
        }
      };

      if (loadDelayMs > 0) {
        window.setTimeout(start, loadDelayMs);
      } else {
        scheduleIdle(start, idleTimeoutMs);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          observer.disconnect();
          triggerLoad();
        }
      },
      { rootMargin, threshold },
    );

    observer.observe(node);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [shouldLoad, rootMargin, threshold, idleTimeoutMs, loadDelayMs]);

  return { ref, shouldLoad };
}
