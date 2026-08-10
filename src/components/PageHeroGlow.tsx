import { cn } from "@/lib/cn";

interface PageHeroGlowProps {
  className?: string;
  size?: "sm" | "lg";
  subdued?: boolean;
}

export default function PageHeroGlow({
  className,
  size = "sm",
  subdued = false,
}: PageHeroGlowProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 overflow-hidden",
        size === "lg" ? "h-[520px]" : "h-64",
        className,
      )}
      aria-hidden="true"
    >
      <div className={cn("home-hero-glow", subdued && "opacity-60")} />
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-b from-transparent to-neutral-950",
          size === "lg" ? "h-32" : "h-24",
        )}
      />
    </div>
  );
}
