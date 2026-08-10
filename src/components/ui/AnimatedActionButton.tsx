"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  ANIMATED_ACTION_BUTTON,
  type AnimatedActionVisualState,
} from "@/lib/animated-action-button";
import { cn } from "@/lib/cn";

export type AnimatedActionButtonVariant = "violet" | "primary" | "secondary";

export interface AnimatedActionButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  state?: AnimatedActionVisualState;
  onAction?: () => void | Promise<void>;
  onRetry?: () => void;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  idleLabel?: ReactNode;
  loadingLabel?: ReactNode;
  successLabel?: ReactNode;
  errorLabel?: ReactNode;
  variant?: AnimatedActionButtonVariant;
  autoResetSuccess?: boolean;
}

const VARIANT_CLASSES: Record<AnimatedActionButtonVariant, string> = {
  violet:
    "bg-gradient-to-b from-violet-500 to-violet-600 text-white shadow-md shadow-violet-950/35 hover:from-violet-400 hover:to-violet-500 hover:shadow-lg focus-visible:ring-violet-400",
  primary:
    "bg-gradient-to-b from-zinc-800 to-zinc-950 text-white shadow-sm shadow-black/20 hover:from-zinc-700 hover:to-zinc-900 focus-visible:ring-zinc-500 dark:from-zinc-100 dark:to-white dark:text-zinc-950",
  secondary:
    "border border-zinc-200/90 bg-white/90 text-zinc-800 shadow-sm hover:border-zinc-300 hover:bg-white focus-visible:ring-zinc-400 dark:border-zinc-700/90 dark:bg-zinc-900/90 dark:text-zinc-100",
};

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-4 w-4", className)}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-4 w-4", className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.25}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-4 w-4", className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
      />
    </svg>
  );
}

function StateLayer({
  active,
  success = false,
  children,
}: {
  active: boolean;
  success?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "animated-action-btn__layer",
        active
          ? "animated-action-btn__layer--active"
          : "animated-action-btn__layer--inactive",
        success && active && "animated-action-btn__layer--success",
      )}
      aria-hidden={!active}
    >
      {children}
    </span>
  );
}

const AnimatedActionButton = forwardRef<
  HTMLButtonElement,
  AnimatedActionButtonProps
>(function AnimatedActionButton(
  {
    state: controlledState,
    onAction,
    onRetry,
    onClick,
    idleLabel = "Continue",
    loadingLabel = "Loading",
    successLabel = "Done",
    errorLabel = "Retry",
    variant = "violet",
    autoResetSuccess = true,
    disabled,
    className,
    type = "button",
    "aria-label": ariaLabel,
    ...props
  },
  ref,
) {
  const [internalState, setInternalState] =
    useState<AnimatedActionVisualState>("idle");
  const [shakeError, setShakeError] = useState(false);
  const inFlightRef = useRef(false);
  const runIdRef = useRef(0);
  const successTimerRef = useRef<number | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useImperativeHandle(ref, () => buttonRef.current as HTMLButtonElement);

  const visualState = controlledState ?? internalState;
  const isControlled = controlledState !== undefined;

  const clearSuccessTimer = useCallback(() => {
    if (successTimerRef.current !== null) {
      window.clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearSuccessTimer, [clearSuccessTimer]);

  useEffect(() => {
    if (visualState !== "error") {
      setShakeError(false);
      return;
    }

    setShakeError(true);
    const timeoutId = window.setTimeout(
      () => setShakeError(false),
      ANIMATED_ACTION_BUTTON.duration.errorShake,
    );
    return () => window.clearTimeout(timeoutId);
  }, [visualState]);

  useEffect(() => {
    if (!autoResetSuccess || visualState !== "success" || isControlled) {
      return;
    }

    clearSuccessTimer();
    successTimerRef.current = window.setTimeout(() => {
      setInternalState("idle");
      successTimerRef.current = null;
    }, ANIMATED_ACTION_BUTTON.duration.successHold);

    return clearSuccessTimer;
  }, [autoResetSuccess, clearSuccessTimer, isControlled, visualState]);

  const transitionTo = useCallback(
    (next: AnimatedActionVisualState) => {
      if (!isControlled) {
        setInternalState(next);
      }
    },
    [isControlled],
  );

  const runAction = useCallback(async () => {
    if (!onAction || inFlightRef.current) {
      return;
    }

    const runId = ++runIdRef.current;
    inFlightRef.current = true;
    transitionTo("loading");

    try {
      await onAction();

      if (runId !== runIdRef.current) {
        return;
      }

      transitionTo("success");
    } catch {
      if (runId !== runIdRef.current) {
        return;
      }

      transitionTo("error");
    } finally {
      if (runId === runIdRef.current) {
        inFlightRef.current = false;
      }
    }
  }, [onAction, transitionTo]);

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (visualState === "loading") {
        event.preventDefault();
        return;
      }

      if (visualState === "error") {
        onRetry?.();
        if (onAction) {
          event.preventDefault();
          void runAction();
          return;
        }
      }

      onClick?.(event);

      if (!event.defaultPrevented && onAction && visualState === "idle") {
        event.preventDefault();
        void runAction();
      }
    },
    [onAction, onClick, onRetry, runAction, visualState],
  );

  const isDisabled =
    disabled ||
    visualState === "loading" ||
    (visualState === "success" && !onAction && !onClick);

  const computedAriaLabel =
    ariaLabel ??
    (visualState === "loading"
      ? "Loading"
      : visualState === "success"
        ? "Success"
        : visualState === "error"
          ? "Error — tap to retry"
          : undefined);

  return (
    <button
      ref={buttonRef}
      type={type}
      disabled={isDisabled}
      onClick={handleClick}
      aria-busy={visualState === "loading"}
      aria-live="polite"
      aria-label={computedAriaLabel}
      className={cn(
        "animated-action-btn inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 disabled:pointer-events-none disabled:opacity-60 motion-reduce:transition-none dark:focus-visible:ring-offset-zinc-950",
        VARIANT_CLASSES[variant],
        shakeError && "animated-action-btn--error-shake motion-reduce:animate-none",
        className,
      )}
      {...props}
    >
      <span className="animated-action-btn__viewport">
        <StateLayer active={visualState === "idle"}>{idleLabel}</StateLayer>

        <StateLayer active={visualState === "loading"}>
          <SpinnerIcon className="motion-safe:animate-spin motion-reduce:animate-none" />
          <span>{loadingLabel}</span>
        </StateLayer>

        <StateLayer active={visualState === "success"} success>
          <CheckIcon />
          <span>{successLabel}</span>
        </StateLayer>

        <StateLayer active={visualState === "error"}>
          <AlertIcon />
          <span>{errorLabel}</span>
        </StateLayer>
      </span>
    </button>
  );
});

export default AnimatedActionButton;
