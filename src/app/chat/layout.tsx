export default function ChatLayout({ children }: LayoutProps<"/chat">) {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col overflow-hidden">
      {children}
    </div>
  );
}
