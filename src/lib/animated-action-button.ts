/** Animation tokens for AnimatedActionButton — documented in README. */
export const ANIMATED_ACTION_BUTTON = {
  duration: {
    state: 220,
    successHold: 1200,
    errorShake: 420,
    hover: 180,
  },
  easing: {
    state: "cubic-bezier(0.22, 1, 0.36, 1)",
    hover: "cubic-bezier(0.4, 0, 0.2, 1)",
    shake: "cubic-bezier(0.36, 0.07, 0.19, 0.97)",
  },
} as const;

export type AnimatedActionVisualState =
  | "idle"
  | "loading"
  | "success"
  | "error";
