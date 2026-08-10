import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
});

vi.mock("next/image", () => ({
  default: function MockNextImage({
    alt,
    src,
    priority: _priority,
    fill: _fill,
    sizes: _sizes,
    className,
    onError,
  }: {
    alt: string;
    src: string;
    priority?: boolean;
    fill?: boolean;
    sizes?: string;
    className?: string;
    onError?: () => void;
  }) {
    return createElement("img", { alt, src, className, onError });
  },
}));

vi.mock("next/dynamic", () => ({
  default: () =>
    function DynamicComponent() {
      return null;
    },
}));
