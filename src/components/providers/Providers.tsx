"use client";

import dynamic from "next/dynamic";
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

function scheduleFirebaseActivation(onActivate: () => void) {
  if (isGoogleRedirectPending()) {
    queueMicrotask(onActivate);
    return () => {};
  }

  // Interaction-only — idle auto-load was pulling Firebase during Lighthouse TBT.
  const onInteraction = () => onActivate();
  const opts: AddEventListenerOptions = { passive: true, once: true };

  window.addEventListener("pointerdown", onInteraction, opts);
  window.addEventListener("keydown", onInteraction, opts);
  window.addEventListener("touchstart", onInteraction, opts);

  return () => {
    window.removeEventListener("pointerdown", onInteraction);
    window.removeEventListener("keydown", onInteraction);
    window.removeEventListener("touchstart", onInteraction);
  };
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

    let cancelled = false;

    const cleanup = scheduleFirebaseActivation(() => {
      if (!cancelled) {
        setLoadFirebase(true);
      }
    });

    return () => {
      cancelled = true;
      cleanup();
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
