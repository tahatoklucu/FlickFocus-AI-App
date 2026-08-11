import { render, screen } from "@testing-library/react";
import Button from "@/components/ui/Button";

describe("Button", () => {
  it("renders children with default primary variant", () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("forwards native button props", () => {
    render(
      <Button type="submit" disabled>
        Submit
      </Button>,
    );

    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
  });
});
