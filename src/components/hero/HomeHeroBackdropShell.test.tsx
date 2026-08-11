import { render, screen } from "@testing-library/react";
import HomeHeroBackdropShell from "@/components/hero/HomeHeroBackdropShell";

describe("HomeHeroBackdropShell", () => {
  it("renders children inside hero backdrop shell", () => {
    render(
      <HomeHeroBackdropShell>
        <p>Hero content</p>
      </HomeHeroBackdropShell>,
    );

    expect(screen.getByText("Hero content")).toBeInTheDocument();
  });
});
