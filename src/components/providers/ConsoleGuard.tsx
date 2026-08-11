"use client";

import { useEffect } from "react";

type ConsoleMethod = "error" | "warn";

const IGNORED_CONSOLE_PATTERNS: RegExp[] = [
  /THREE\.Clock: This module has been deprecated/i,
  /Please use THREE\.Timer instead/i,
  /Download the React DevTools/i,
  /chrome-extension:\/\//i,
  /installHook\.js/i,
  /was detected as the Largest Contentful Paint/i,
  /Please add the `loading="eager"` property/i,
];

function shouldIgnoreConsoleMessage(args: unknown[]): boolean {
  const message = args
    .map((arg) => {
      if (typeof arg === "string") {
        return arg;
      }

      if (arg instanceof Error) {
        return `${arg.message}\n${arg.stack ?? ""}`;
      }

      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
    .join(" ");

  return IGNORED_CONSOLE_PATTERNS.some((pattern) => pattern.test(message));
}

function patchConsoleMethod(method: ConsoleMethod) {
  const original = console[method].bind(console);

  console[method] = (...args: unknown[]) => {
    if (shouldIgnoreConsoleMessage(args)) {
      return;
    }

    original(...args);
  };

  return original;
}

/**
 * Filters known third-party / framework hints from the browser console so
 * real app errors remain visible during development.
 */
export default function ConsoleGuard() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    const originalError = patchConsoleMethod("error");
    const originalWarn = patchConsoleMethod("warn");

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  return null;
}
