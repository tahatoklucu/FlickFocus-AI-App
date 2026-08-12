import ChatPageClient from "@/components/chat/ChatPageClient";
import PageHeroGlow from "@/components/layout/PageHeroGlow";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "AI Chat",
  description:
    "Chat with FlickFocus AI for movie recommendations, trivia, and cinematic insights.",
  path: "/chat",
});

export default function ChatPage() {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-neutral-950">
      <PageHeroGlow subdued />

      <div className="relative mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col px-3 py-2 sm:px-6 sm:py-4 lg:px-8">
        <header className="mb-2 shrink-0 text-center sm:mb-4">
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-300 sm:mb-3 sm:px-3 sm:py-1 sm:text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" aria-hidden="true" />
            AI assistant
          </span>
          <h1 className="bg-gradient-to-br from-white via-neutral-100 to-neutral-400 bg-clip-text text-xl font-extrabold tracking-tight text-transparent sm:text-3xl lg:text-4xl">
            FlickFocus AI
          </h1>
          <p className="mt-1.5 px-2 text-[11px] leading-relaxed text-neutral-400 sm:mt-2 sm:px-0 sm:text-sm lg:text-base">
            Your movie-savvy assistant — streaming responses in real time
          </p>
        </header>

        <ChatPageClient />
      </div>
    </div>
  );
}
