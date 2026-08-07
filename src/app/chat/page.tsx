import ChatPageClient from "@/components/ChatPageClient";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "AI Chat",
  description:
    "Chat with FlickFocus AI for movie recommendations, trivia, and cinematic insights.",
  path: "/chat",
});

export default function ChatPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <header className="mb-2 shrink-0 text-center sm:mb-4">
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl lg:text-3xl">
            FlickFocus AI
          </h1>
          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 sm:text-sm lg:text-base">
            Your movie-savvy assistant — streaming responses in real time
          </p>
        </header>

        <ChatPageClient />
      </div>
    </div>
  );
}
