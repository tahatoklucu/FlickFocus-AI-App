import { describe, expect, it } from "vitest";
import { isValidPosterUrl } from "@/lib/poster/poster-url";

describe("isValidPosterUrl", () => {
  it("rejects missing and N/A posters", () => {
    expect(isValidPosterUrl(undefined)).toBe(false);
    expect(isValidPosterUrl("N/A")).toBe(false);
    expect(isValidPosterUrl("")).toBe(false);
  });

  it("accepts amazon media poster URLs", () => {
    expect(
      isValidPosterUrl(
        "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg",
      ),
    ).toBe(true);
  });

  it("rejects non-amazon hosts", () => {
    expect(isValidPosterUrl("https://example.com/poster.jpg")).toBe(false);
  });
});
