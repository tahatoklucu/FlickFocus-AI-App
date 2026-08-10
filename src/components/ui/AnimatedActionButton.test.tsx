import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AnimatedActionButton from "@/components/ui/AnimatedActionButton";
import { ANIMATED_ACTION_BUTTON } from "@/lib/animated-action-button";

describe("AnimatedActionButton", () => {
  it("renders idle label by default", () => {
    render(<AnimatedActionButton idleLabel="Send" />);

    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument();
  });

  it("runs onAction and shows loading then success states", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    let resolveAction: () => void = () => {};
    const onAction = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveAction = resolve;
        }),
    );

    render(
      <AnimatedActionButton
        idleLabel="Send"
        loadingLabel="Sending"
        successLabel="Sent"
        onAction={onAction}
        autoResetSuccess={false}
      />,
    );

    const button = screen.getByRole("button", { name: "Send" });
    await user.click(button);

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Loading" })).toBeDisabled();
    expect(screen.getByText("Sending")).toBeInTheDocument();

    resolveAction();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Success" })).toBeInTheDocument();
    });
    expect(screen.getByText("Sent")).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("shows error state when onAction rejects and retries on click", async () => {
    const user = userEvent.setup();
    const onAction = vi
      .fn()
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(undefined);

    render(
      <AnimatedActionButton
        idleLabel="Send"
        errorLabel="Retry"
        onAction={onAction}
        autoResetSuccess={false}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Error — tap to retry" })).toBeInTheDocument();
    });
    expect(screen.getByText("Retry")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Error — tap to retry" }));

    await waitFor(() => {
      expect(onAction).toHaveBeenCalledTimes(2);
    });
  });

  it("respects controlled visual state", () => {
    render(
      <AnimatedActionButton
        state="loading"
        idleLabel="Send"
        loadingLabel="Sending"
        aria-label="Send message"
      />,
    );

    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
    expect(screen.getByText("Sending")).toBeInTheDocument();
  });

  it("auto-resets to idle after success when uncontrolled", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(
      <AnimatedActionButton
        idleLabel="Continue"
        successLabel="Done"
        onAction={async () => undefined}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Success" })).toBeInTheDocument();
    });

    vi.advanceTimersByTime(ANIMATED_ACTION_BUTTON.duration.successHold + 50);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  it("invokes onClick without onAction", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <AnimatedActionButton idleLabel="Continue" onClick={onClick} />,
    );

    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
