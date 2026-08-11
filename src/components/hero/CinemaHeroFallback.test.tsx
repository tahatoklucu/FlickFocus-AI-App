import { render, screen } from "@testing-library/react";
import CinemaHeroFallback from "@/components/hero/CinemaHeroFallback";

describe("CinemaHeroFallback", () => {
  it("renders static cinema illustration", () => {
    render(<CinemaHeroFallback embedded />);

    expect(
      screen.getByLabelText("Cinematic film reel illustration"),
    ).toBeInTheDocument();
  });
});
