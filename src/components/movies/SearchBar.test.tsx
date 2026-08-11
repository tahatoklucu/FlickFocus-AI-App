import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchBar from "@/components/movies/SearchBar";

describe("SearchBar", () => {
  it("submits trimmed query on form submit", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const onQueryChange = vi.fn();

    render(
      <SearchBar
        query="  Inception  "
        onQueryChange={onQueryChange}
        onSearch={onSearch}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(onSearch).toHaveBeenCalledWith("Inception");
  });

  it("disables submit when query is empty", () => {
    render(
      <SearchBar query="" onQueryChange={vi.fn()} onSearch={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: "Search" })).toBeDisabled();
  });

  it("calls onClear when input is cleared", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    const onQueryChange = vi.fn();

    render(
      <SearchBar
        query="Matrix"
        onQueryChange={onQueryChange}
        onSearch={vi.fn()}
        onClear={onClear}
      />,
    );

    await user.clear(screen.getByRole("textbox", { name: "Search for a movie" }));

    expect(onQueryChange).toHaveBeenCalled();
    expect(onClear).toHaveBeenCalled();
  });
});
