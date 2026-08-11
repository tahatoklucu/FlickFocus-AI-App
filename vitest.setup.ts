import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
});

vi.mock("next/image", () => ({
  default: function MockNextImage(props: {
    alt: string;
    src: string;
    className?: string;
    onError?: () => void;
  }) {
    const { alt, src, className, onError } = props;
    return createElement("img", { alt, src, className, onError });
  },
}));

vi.mock("next/dynamic", () => ({
  default: () =>
    function DynamicComponent() {
      return null;
    },
}));

vi.mock("next/link", () => ({
  default: function MockLink({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) {
    return createElement("a", { href, ...props }, children);
  },
}));
