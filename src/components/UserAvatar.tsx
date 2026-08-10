"use client";

import { useEffect, useState } from "react";
import { isValidPhotoURL } from "@/lib/avatar-utils";
import { cn } from "@/lib/cn";

interface UserAvatarProps {
  displayName: string;
  photoURL?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-7 w-7 min-h-7 min-w-7 text-xs",
  md: "h-9 w-9 min-h-9 min-w-9 text-sm",
  lg: "h-20 w-20 min-h-20 min-w-20 text-2xl",
  xl: "h-24 w-24 min-h-24 min-w-24 text-3xl",
} as const;

function getInitial(displayName: string): string {
  const trimmed = displayName.trim();
  if (!trimmed) {
    return "?";
  }

  return trimmed.charAt(0).toUpperCase();
}

export default function UserAvatar({
  displayName,
  photoURL,
  size = "md",
  className,
}: UserAvatarProps) {
  const initial = getInitial(displayName);
  const resolvedPhoto =
    photoURL && isValidPhotoURL(photoURL) ? photoURL.trim() : null;
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [resolvedPhoto]);

  if (resolvedPhoto && !imageFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolvedPhoto}
        alt={`${displayName || "User"} avatar`}
        onError={() => setImageFailed(true)}
        className={cn(
          "shrink-0 rounded-full border border-neutral-700/80 bg-neutral-900 object-cover",
          sizeClasses[size],
          className,
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 font-bold leading-none text-white shadow-inner ring-1 ring-white/10",
        sizeClasses[size],
        className,
      )}
      aria-hidden={true}
    >
      {initial}
    </span>
  );
}

export { resolveUserPhotoURL } from "@/lib/avatar-utils";
