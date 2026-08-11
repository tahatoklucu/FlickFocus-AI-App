import { render } from "@testing-library/react";
import PageHeroGlow from "@/components/layout/PageHeroGlow";

describe("PageHeroGlow", () => {
  it("renders decorative hero glow layer", () => {
    const { container } = render(<PageHeroGlow size="lg" subdued />);

    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
    expect(container.querySelector(".home-hero-glow")).toBeTruthy();
  });
});
