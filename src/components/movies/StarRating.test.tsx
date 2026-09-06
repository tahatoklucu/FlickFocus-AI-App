import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StarRating from "@/components/movies/StarRating";

describe("StarRating", () => {
  it("reports the score that was clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<StarRating value={null} onChange={onChange} />);

    expect(screen.getByText("Not rated yet")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Rate 7 out of 10" }));
    expect(onChange).toHaveBeenCalledWith(7);
  });

  it("clears the score when the current one is clicked again", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<StarRating value={7} onChange={onChange} />);

    await user.click(screen.getByRole("radio", { name: "Rate 7 out of 10" }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("marks only the selected star as checked and shows the score", () => {
    render(<StarRating value={3} onChange={vi.fn()} />);

    const checked = screen
      .getAllByRole("radio")
      .filter((star) => star.getAttribute("aria-checked") === "true");

    expect(checked).toHaveLength(1);
    expect(checked[0]).toHaveAccessibleName("Rate 3 out of 10");
    expect(screen.getByText("3/10")).toBeInTheDocument();
  });

  it("ignores clicks while disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<StarRating value={null} onChange={onChange} disabled />);

    await user.click(screen.getByRole("radio", { name: "Rate 5 out of 10" }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
