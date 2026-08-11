import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MovieNotFound from "@/components/movies/MovieNotFound";

describe("MovieNotFound", () => {
  it("renders default not-found messaging", () => {
    render(<MovieNotFound />);

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Movie not found")).toBeInTheDocument();
    expect(
      screen.getByText(/couldn't find a match in the OMDb catalog/i),
    ).toBeInTheDocument();
  });

  it("calls action handlers when provided", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onSearchAgain = vi.fn();

    render(
      <MovieNotFound onClose={onClose} onSearchAgain={onSearchAgain} compact />,
    );

    await user.click(screen.getByRole("button", { name: "Try another search" }));
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(onSearchAgain).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
