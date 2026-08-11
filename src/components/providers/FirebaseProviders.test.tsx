import { render, screen } from "@testing-library/react";
import FirebaseProviders from "@/components/providers/FirebaseProviders";

vi.mock("@/context/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
}));

vi.mock("@/context/FavoritesContext", () => ({
  FavoritesProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="favorites-provider">{children}</div>
  ),
}));

describe("FirebaseProviders", () => {
  it("wraps children with auth and favorites providers", () => {
    render(
      <FirebaseProviders>
        <p>App content</p>
      </FirebaseProviders>,
    );

    expect(screen.getByTestId("auth-provider")).toBeInTheDocument();
    expect(screen.getByTestId("favorites-provider")).toBeInTheDocument();
    expect(screen.getByText("App content")).toBeInTheDocument();
  });
});
