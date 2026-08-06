export default function ChatLayout({ children }: LayoutProps<"/chat">) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {children}
    </div>
  );
}
