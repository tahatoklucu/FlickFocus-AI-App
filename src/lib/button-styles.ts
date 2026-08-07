import { cn } from "@/lib/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "violet"
  | "amber"
  | "pill"
  | "pillPrimary"
  | "pillGhost"
  | "icon"
  | "iconGhost"
  | "menu"
  | "menuDanger"
  | "favorite"
  | "segment"
  | "segmentActive"
  | "segmentIdle"
  | "float"
  | "google";

export type ButtonSize = "sm" | "md" | "lg" | "icon" | "iconMd";

const base =
  "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 active:scale-[0.98] motion-reduce:transform-none motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-offset-zinc-950";

const variants: Record<ButtonVariant, string> = {
  primary:
    "rounded-xl bg-gradient-to-b from-zinc-800 to-zinc-950 text-white shadow-sm shadow-black/20 hover:from-zinc-700 hover:to-zinc-900 hover:shadow-md focus-visible:ring-zinc-500 dark:from-zinc-100 dark:to-white dark:text-zinc-950 dark:hover:from-white dark:hover:to-zinc-100",
  secondary:
    "rounded-xl border border-zinc-200/90 bg-white/90 text-zinc-800 shadow-sm backdrop-blur-sm hover:border-zinc-300 hover:bg-white hover:shadow-md focus-visible:ring-zinc-400 dark:border-zinc-700/90 dark:bg-zinc-900/90 dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-800",
  ghost:
    "rounded-xl text-zinc-600 hover:bg-zinc-100/90 focus-visible:ring-zinc-400 dark:text-zinc-300 dark:hover:bg-white/10",
  danger:
    "rounded-xl bg-gradient-to-b from-red-500 to-red-600 text-white shadow-sm shadow-red-950/30 hover:from-red-400 hover:to-red-500 hover:shadow-md focus-visible:ring-red-400",
  violet:
    "rounded-xl bg-gradient-to-b from-violet-500 to-violet-600 text-white shadow-md shadow-violet-950/35 hover:from-violet-400 hover:to-violet-500 hover:shadow-lg focus-visible:ring-violet-400",
  amber:
    "rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 text-zinc-950 shadow-md shadow-amber-950/25 hover:from-amber-300 hover:to-amber-400 hover:shadow-lg focus-visible:ring-amber-400",
  pill:
    "min-h-11 rounded-full border border-neutral-700/70 bg-neutral-900/80 px-3 py-2 text-sm text-neutral-100 shadow-sm shadow-black/20 hover:border-neutral-600 hover:bg-neutral-800/90 hover:shadow-md focus-visible:ring-neutral-500",
  pillPrimary:
    "min-h-11 rounded-full bg-gradient-to-b from-white to-zinc-100 px-4 py-2 text-sm text-neutral-950 shadow-md shadow-black/25 hover:from-zinc-50 hover:to-white hover:shadow-lg focus-visible:ring-white/60",
  pillGhost:
    "min-h-11 rounded-full px-4 py-2 text-sm text-neutral-300 hover:bg-white/10 hover:text-white focus-visible:ring-neutral-500",
  icon:
    "rounded-full border border-zinc-200/90 bg-white/95 text-zinc-700 shadow-sm backdrop-blur-sm hover:border-zinc-300 hover:bg-white hover:shadow-md focus-visible:ring-zinc-400 dark:border-zinc-700/90 dark:bg-zinc-900/95 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800",
  iconGhost:
    "rounded-full text-zinc-500 hover:bg-zinc-100/90 hover:text-zinc-800 focus-visible:ring-zinc-400 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
  menu:
    "w-full justify-between rounded-lg px-4 py-2.5 text-left text-sm font-medium text-neutral-300 transition hover:bg-white/5 hover:text-white focus-visible:ring-neutral-500",
  menuDanger:
    "w-full rounded-lg px-4 py-2.5 text-left text-sm font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300 focus-visible:ring-red-400",
  favorite:
    "rounded-full bg-black/50 text-white shadow-sm shadow-black/30 backdrop-blur-md hover:bg-black/70 hover:shadow-md focus-visible:ring-white/30 dark:bg-zinc-900/85 dark:hover:bg-zinc-800",
  segment:
    "min-h-11 flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 focus-visible:ring-zinc-400",
  segmentActive:
    "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50",
  segmentIdle:
    "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200",
  float:
    "min-h-11 rounded-full px-4 py-2 text-sm shadow-lg shadow-black/20 backdrop-blur-sm focus-visible:ring-violet-400 border border-zinc-300/80 bg-white/95 text-zinc-800 hover:border-zinc-400 hover:bg-white dark:border-zinc-600/80 dark:bg-zinc-900/95 dark:text-zinc-100 dark:hover:border-zinc-500 dark:hover:bg-zinc-800",
  google:
    "rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-lg shadow-black/25 hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-xl focus-visible:ring-zinc-400",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 text-xs",
  md: "min-h-11 px-4 text-sm",
  lg: "min-h-12 px-6 text-sm",
  icon: "h-11 w-11 shrink-0 p-0",
  iconMd: "h-9 w-9 shrink-0 p-0",
};

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
): string {
  const skipSizePadding =
    variant === "icon" ||
    variant === "iconGhost" ||
    variant === "menu" ||
    variant === "menuDanger" ||
    variant === "pill" ||
    variant === "pillPrimary" ||
    variant === "pillGhost" ||
    variant === "favorite" ||
    variant === "segment" ||
    variant === "segmentActive" ||
    variant === "segmentIdle" ||
    variant === "float";

  return cn(
    base,
    variants[variant],
    skipSizePadding ? undefined : sizes[size],
    (variant === "icon" || variant === "iconGhost") && sizes.icon,
    className,
  );
}
