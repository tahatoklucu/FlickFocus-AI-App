import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchPagination from "@/components/movies/SearchPagination";

describe("SearchPagination", () => {
  it("renders nothing when everything fits on one page", () => {
    const { container } = render(
      <SearchPagination
        page={1}
        totalPages={1}
        totalResults={4}
        onPageChange={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("marks the current page and reports the totals", () => {
    render(
      <SearchPagination
        page={2}
        totalPages={3}
        totalResults={1234}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Page 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: "Page 1" })).not.toHaveAttribute(
      "aria-current",
    );
    expect(screen.getByText(/1,234 matches/)).toBeInTheDocument();
  });

  it("steps forward and backward from the current page", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();

    render(
      <SearchPagination
        page={2}
        totalPages={3}
        totalResults={50}
        onPageChange={onPageChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Previous page" }));
    await user.click(screen.getByRole("button", { name: "Next page" }));
    await user.click(screen.getByRole("button", { name: "Page 3" }));

    expect(onPageChange.mock.calls).toEqual([[1], [3], [3]]);
  });

  it("disables the step buttons at both ends", () => {
    const { unmount } = render(
      <SearchPagination
        page={1}
        totalPages={3}
        totalResults={50}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeEnabled();
    unmount();

    render(
      <SearchPagination
        page={3}
        totalPages={3}
        totalResults={50}
        onPageChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("locks every control while a page is loading", () => {
    render(
      <SearchPagination
        page={2}
        totalPages={3}
        totalResults={50}
        isLoading
        onPageChange={vi.fn()}
      />,
    );

    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeDisabled();
    }
  });
});
