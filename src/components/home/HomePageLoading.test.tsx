import { render } from "@testing-library/react";
import HomePageLoading from "@/components/home/HomePageLoading";

describe("HomePageLoading", () => {
  it("renders homepage skeleton placeholders", () => {
    const { container } = render(<HomePageLoading />);

    expect(container.querySelectorAll(".aspect-\\[2\\/3\\]").length).toBe(10);
  });
});
