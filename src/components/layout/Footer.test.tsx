import { render, screen } from "@testing-library/react";
import Footer from "@/components/layout/Footer";
import { usePathname } from "next/navigation";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

describe("Footer", () => {
  it("renders branding and social links on standard pages", () => {
    vi.mocked(usePathname).mockReturnValue("/");

    render(<Footer />);

    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "FlickFocus" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(
      screen.getByRole("link", { name: "View FlickFocus on GitHub" }),
    ).toHaveAttribute("href", "https://github.com/tahatoklucu/FlickFocus-AI-App");
  });

  it("hides footer on chat page", () => {
    vi.mocked(usePathname).mockReturnValue("/chat");

    const { container } = render(<Footer />);

    expect(container).toBeEmptyDOMElement();
  });
});
