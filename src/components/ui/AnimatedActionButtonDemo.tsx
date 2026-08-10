"use client";

import { useCallback, useState } from "react";
import AnimatedActionButton from "@/components/ui/AnimatedActionButton";
import type { AnimatedActionVisualState } from "@/lib/animated-action-button";

type DemoScenario = "success" | "error";

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export default function AnimatedActionButtonDemo() {
  const [scenario, setScenario] = useState<DemoScenario>("success");
  const [controlledState, setControlledState] =
    useState<AnimatedActionVisualState>("idle");

  const runControlledDemo = useCallback(async () => {
    setControlledState("loading");
    await wait(900);
    setControlledState(scenario === "success" ? "success" : "error");
    if (scenario === "success") {
      await wait(1200);
      setControlledState("idle");
    }
  }, [scenario]);

  const runUncontrolledAction = useCallback(async () => {
    await wait(800);
    if (scenario === "error") {
      throw new Error("Simulated failure");
    }
  }, [scenario]);

  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5 ring-1 ring-neutral-800/80">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-neutral-100">
          Animated Action Button
        </h3>
        <p className="mt-1 text-xs text-neutral-500">
          Micro-interaction demo — controlled &amp; uncontrolled modes
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(["success", "error"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setScenario(value)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              scenario === value
                ? "bg-violet-500/20 text-violet-200 ring-1 ring-violet-500/30"
                : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {value === "success" ? "Success path" : "Error path"}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <AnimatedActionButton
          state={controlledState}
          idleLabel="Controlled"
          loadingLabel="Working"
          successLabel="Saved"
          errorLabel="Retry"
          onClick={() => {
            if (controlledState === "loading") {
              return;
            }
            if (controlledState === "error") {
              setControlledState("idle");
            }
            void runControlledDemo();
          }}
          variant="primary"
        />

        <AnimatedActionButton
          idleLabel="Uncontrolled"
          loadingLabel="Sending"
          successLabel="Sent"
          errorLabel="Retry"
          onAction={runUncontrolledAction}
          onRetry={() => undefined}
          variant="violet"
        />
      </div>
    </section>
  );
}
