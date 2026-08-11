import { render, screen } from "@testing-library/react";
import StreamingMarkdownText from "@/components/chat/StreamingMarkdownText";

describe("StreamingMarkdownText", () => {
  it("renders markdown html for completed text", () => {
    render(
      <StreamingMarkdownText
        text="Hello **world**"
        isStreaming={false}
      />,
    );

    expect(screen.getByText("world")).toBeInTheDocument();
    expect(document.querySelector("strong")).not.toBeNull();
  });

  it("returns null for empty text", () => {
    const { container } = render(
      <StreamingMarkdownText text="   " isStreaming={false} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
