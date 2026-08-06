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
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <header className="mb-4 shrink-0 text-center sm:mb-5">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            FlickFocus AI
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 sm:text-base">
            Your movie-savvy assistant — streaming responses in real time
          </p>
        </header>

        <ChatPageClient />
      </div>
    </div>
  );
}
