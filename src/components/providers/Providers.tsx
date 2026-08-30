"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AuthPlaceholderProvider } from "@/context/AuthPlaceholderProvider";
import type { AuthModalMode } from "@/context/auth-context.shared";
import { hasAuthSessionHint } from "@/lib/firebase/auth-session-hint";
import {
  isGoogleRedirectPending,
  markPendingAuthModal,
} from "@/lib/firebase/google-auth-pending";
import { scheduleIdleTask } from "@/lib/schedule-idle";

const FirebaseProviders = dynamic(
  () => import("@/components/providers/FirebaseProviders"),
  { ssr: false },
);

const AUTH_ROUTE_PREFIXES = ["/favorites", "/profile"];

function isAuthHeavyRoute(pathname: string | null): boolean {
  if (!pathname) {
    return false;
  }

  return AUTH_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Firebase Auth (~93 KB plus a getProjectConfig round trip) only loads when it
 * can actually do something: a returning signed-in visitor, an auth-only route,
 * a redirect coming back, or an explicit tap on a sign-in control. Anonymous
 * first loads never pay for it — a blanket timer used to pull it in for
 * everyone and dominated main-thread time.
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

    if (!hasAuthSessionHint()) {
      return;
    }

    // Returning signed-in visitor: restore the session once the page is idle so
    // the header stops showing the signed-out state, without blocking load.
    const cancelIdle = scheduleIdleTask(
      () => {
        if (!cancelled) {
          setLoadFirebase(true);
        }
      },
      { afterLoad: true, timeout: 3_000 },
    );

    return () => {
      cancelled = true;
      cancelIdle();
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
