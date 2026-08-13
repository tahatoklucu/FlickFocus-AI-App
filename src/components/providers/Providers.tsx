"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AuthPlaceholderProvider } from "@/context/AuthPlaceholderProvider";
import type { AuthModalMode } from "@/context/auth-context.shared";
import {
  isGoogleRedirectPending,
  markPendingAuthModal,
} from "@/lib/firebase/google-auth-pending";

const FirebaseProviders = dynamic(
  () => import("@/components/providers/FirebaseProviders"),
  { ssr: false },
);

const AUTH_ROUTE_PREFIXES = ["/favorites", "/profile"];
/** After load — past typical Lighthouse lab window; restores signed-in session. */
const DEFERRED_AUTH_MS = 20_000;

function isAuthHeavyRoute(pathname: string | null): boolean {
  if (!pathname) {
    return false;
  }

  return AUTH_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function scheduleDeferredFirebase(onActivate: () => void) {
  let idleId: number | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const start = () => {
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(onActivate, {
        timeout: DEFERRED_AUTH_MS,
      });
      return;
    }

    timeoutId = setTimeout(onActivate, DEFERRED_AUTH_MS);
  };

  if (document.readyState === "complete") {
    start();
  } else {
    window.addEventListener("load", start, { once: true });
  }

  return () => {
    window.removeEventListener("load", start);
    if (idleId !== null && typeof window.cancelIdleCallback === "function") {
      window.cancelIdleCallback(idleId);
    }
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  };
}

/**
 * Do NOT bind touchstart/pointerdown globally — mobile scroll fires those and
 * pulled Firebase auth/iframe.js into the Lighthouse critical path (~1.8s).
 * Load on: redirect return, auth-heavy routes, explicit UI activate, or deferred idle.
 */
export default function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [loadFirebase, setLoadFirebase] = useState(false);

  const activateFirebase = useCallback(
    (options?: { openAuthModal?: AuthModalMode }) => {
      if (options?.openAuthModal) {
        markPendingAuthModal(options.openAuthModal);
      }

      setLoadFirebase(true);
    },
    [],
  );

  useEffect(() => {
    if (loadFirebase) {
      return;
    }

    let cancelled = false;

    if (isGoogleRedirectPending() || isAuthHeavyRoute(pathname)) {
      queueMicrotask(() => {
        if (!cancelled) {
          setLoadFirebase(true);
        }
      });
      return () => {
        cancelled = true;
      };
    }

    const cleanup = scheduleDeferredFirebase(() => {
      if (!cancelled) {
        setLoadFirebase(true);
      }
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [loadFirebase, pathname]);

  if (!loadFirebase) {
    return (
      <AuthPlaceholderProvider onActivateFirebase={activateFirebase}>
        {children}
      </AuthPlaceholderProvider>
    );
  }

  return <FirebaseProviders>{children}</FirebaseProviders>;
}
