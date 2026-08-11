import { cn } from "@/lib/cn";

interface HomeHeroBackdropShellProps {
  className?: string;
  children?: React.ReactNode;
}

/** Server-rendered hero backdrop — fills its positioned parent (hero header zone only). */
export default function HomeHeroBackdropShell({
  className,
  children,
}: HomeHeroBackdropShellProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-neutral-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_30%_0%,rgba(124,58,237,0.28),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_90%_20%,rgba(201,162,39,0.14),transparent_55%)]" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-neutral-950" />
      {children}
    </div>
  );
}
