"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AuthPlaceholderProvider } from "@/context/AuthPlaceholderProvider";
import type { AuthModalMode } from "@/context/auth-context.shared";
import {
  isGoogleRedirectPending,
  markPendingAuthModal,
} from "@/lib/google-auth-pending";

const FirebaseProviders = dynamic(
  () => import("@/components/FirebaseProviders"),
  { ssr: false },
);

function scheduleFirebaseActivation(onActivate: () => void) {
  if (isGoogleRedirectPending()) {
    onActivate();
    return;
  }

  const activate = () => onActivate();

  const onInteraction = () => activate();

  window.addEventListener("pointerdown", onInteraction, { passive: true });
  window.addEventListener("keydown", onInteraction, { passive: true });

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(activate, { timeout: 8000 });
      } else {
        setTimeout(activate, 5000);
      }
    });
  });
}

export default function Providers({ children }: { children: ReactNode }) {
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

    if (isGoogleRedirectPending()) {
      setLoadFirebase(true);
      return;
    }

    let cancelled = false;

    scheduleFirebaseActivation(() => {
      if (!cancelled) {
        setLoadFirebase(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadFirebase]);

  if (!loadFirebase) {
    return (
      <AuthPlaceholderProvider onActivateFirebase={activateFirebase}>
        {children}
      </AuthPlaceholderProvider>
    );
  }

  return <FirebaseProviders>{children}</FirebaseProviders>;
}
