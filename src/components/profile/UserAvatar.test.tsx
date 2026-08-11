import { render, screen } from "@testing-library/react";
import UserAvatar from "@/components/profile/UserAvatar";

describe("UserAvatar", () => {
  it("renders initial when photo url is missing", () => {
    render(<UserAvatar displayName="Taha Toklucu" />);

    expect(screen.getByText("T")).toBeInTheDocument();
  });

  it("renders image when photo url is valid", () => {
    render(
      <UserAvatar
        displayName="Taha Toklucu"
        photoURL="https://example.com/avatar.png"
      />,
    );

    expect(screen.getByRole("img", { name: "Taha Toklucu avatar" })).toHaveAttribute(
      "src",
      "https://example.com/avatar.png",
    );
  });
});
