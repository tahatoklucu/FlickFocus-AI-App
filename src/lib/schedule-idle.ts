type CancelIdleTask = () => void;

interface ScheduleIdleTaskOptions {
  /** Upper bound before the task runs even if the main thread stays busy. */
  timeout?: number;
  /** Wait for the window `load` event before queueing the idle callback. */
  afterLoad?: boolean;
}

/**
 * Runs non-critical work once the main thread is free, so it never competes
 * with hydration or the LCP image. Returns a cancel function.
 */
export function scheduleIdleTask(
  task: () => void,
  { timeout = 2_000, afterLoad = false }: ScheduleIdleTaskOptions = {},
): CancelIdleTask {
  if (typeof window === "undefined") {
    return () => {};
  }

  let idleId: number | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let cancelled = false;

  const queue = () => {
    if (cancelled) {
      return;
    }

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(() => task(), { timeout });
      return;
    }

    timeoutId = setTimeout(task, 0);
  };

  const shouldWaitForLoad = afterLoad && document.readyState !== "complete";

  if (shouldWaitForLoad) {
    window.addEventListener("load", queue, { once: true });
  } else {
    queue();
  }

  return () => {
    cancelled = true;
    window.removeEventListener("load", queue);

    if (idleId !== null && typeof window.cancelIdleCallback === "function") {
      window.cancelIdleCallback(idleId);
    }

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  };
}
