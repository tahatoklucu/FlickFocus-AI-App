"use client";

import type { ReactNode } from "react";
import { useLazyInView } from "@/hooks/useLazyInView";
import { cn } from "@/lib/cn";

interface DeferredMountProps {
  children: ReactNode;
  placeholder?: ReactNode;
  className?: string;
  minHeightClass?: string;
}

/** Mount children only after the slot nears the viewport to protect LCP / TBT. */
export default function DeferredMount({
  children,
  placeholder = null,
  className,
  minHeightClass = "min-h-[28rem]",
}: DeferredMountProps) {
  const { ref, shouldLoad } = useLazyInView({
    rootMargin: "0px",
    threshold: 0.05,
    idleTimeoutMs: 2500,
  });

  return (
    <div ref={ref} className={cn(!shouldLoad && minHeightClass, className)}>
      {shouldLoad ? children : placeholder}
    </div>
  );
}
