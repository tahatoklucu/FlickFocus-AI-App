import { render, screen } from "@testing-library/react";
import DeferredMount from "@/components/common/DeferredMount";
import { useLazyInView } from "@/hooks/useLazyInView";

vi.mock("@/hooks/useLazyInView", () => ({
  useLazyInView: vi.fn(),
}));

describe("DeferredMount", () => {
  it("renders placeholder until lazy gate opens", () => {
    vi.mocked(useLazyInView).mockReturnValue({
      ref: vi.fn(),
      shouldLoad: false,
    });

    render(
      <DeferredMount placeholder={<p>Loading section</p>}>
        <p>Loaded content</p>
      </DeferredMount>,
    );

    expect(screen.getByText("Loading section")).toBeInTheDocument();
    expect(screen.queryByText("Loaded content")).not.toBeInTheDocument();
  });

  it("mounts children when shouldLoad is true", () => {
    vi.mocked(useLazyInView).mockReturnValue({
      ref: vi.fn(),
      shouldLoad: true,
    });

    render(
      <DeferredMount placeholder={<p>Loading section</p>}>
        <p>Loaded content</p>
      </DeferredMount>,
    );

    expect(screen.getByText("Loaded content")).toBeInTheDocument();
  });
});
