"use client";

import dynamic from "next/dynamic";
import DeferredMount from "@/components/common/DeferredMount";

const CinemaExperienceSection = dynamic(
  () => import("@/components/hero/CinemaExperienceSection"),
  { ssr: false },
);

/** Below-the-fold 3D section — chunk loads only when scrolled near view. */
export default function CinemaExperienceDeferred() {
  return (
    <DeferredMount minHeightClass="min-h-[28rem]">
      <CinemaExperienceSection />
    </DeferredMount>
  );
}
