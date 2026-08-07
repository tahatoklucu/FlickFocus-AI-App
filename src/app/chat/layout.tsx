import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function ChatLayout({ children }: LayoutProps<"/chat">) {
  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col overflow-hidden">
      {children}
    </div>
  );
}
