import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function ChatLayout({ children }: LayoutProps<"/chat">) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden overscroll-none supports-[height:100dvh]:h-[calc(100dvh-4rem)]">
      {children}
    </div>
  );
}
