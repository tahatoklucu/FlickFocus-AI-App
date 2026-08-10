import type { UIMessage } from "ai";
import type { ChatMovieDetailsOutput, ChatMovieSearchOutput } from "@/types/chat-tools";

export const mockChatSearchOutput: ChatMovieSearchOutput = {
  query: "Inception",
  totalResults: 2,
  results: [
    {
      imdbID: "tt1375666",
      title: "Inception",
      year: "2010",
      poster: "N/A",
      type: "movie",
    },
    {
      imdbID: "tt0133093",
      title: "The Matrix",
      year: "1999",
      poster: "N/A",
      type: "movie",
    },
  ],
};

export const mockChatMovieDetails: ChatMovieDetailsOutput = {
  imdbID: "tt1375666",
  title: "Inception",
  year: "2010",
  rated: "PG-13",
  runtime: "148 min",
  genre: "Action, Adventure, Sci-Fi",
  director: "Christopher Nolan",
  actors: "Leonardo DiCaprio, Joseph Gordon-Levitt",
  plot: "A thief who steals corporate secrets through dream-sharing technology.",
  poster: "N/A",
  imdbRating: "8.8",
  rottenTomatoes: "87%",
  metascore: "74",
};

export function buildMockChatSseBody(text: string): string {
  const textPartId = "text-part-1";
  const chunks = [
    { type: "start" },
    { type: "start-step" },
    { type: "text-start", id: textPartId },
    { type: "text-delta", id: textPartId, delta: text },
    { type: "text-end", id: textPartId },
    { type: "finish-step" },
    { type: "finish" },
  ];

  return chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join("");
}

export function createAssistantMessage(
  parts: UIMessage["parts"],
  id = "assistant-1",
): UIMessage {
  return {
    id,
    role: "assistant",
    parts,
  };
}

export function createUserMessage(text: string, id = "user-1"): UIMessage {
  return {
    id,
    role: "user",
    parts: [{ type: "text", text }],
  };
}

export function createSearchToolPart(
  output: ChatMovieSearchOutput = mockChatSearchOutput,
  toolCallId = "tool-search-1",
): UIMessage["parts"][number] {
  return {
    type: "tool-searchMovies",
    toolCallId,
    state: "output-available",
    input: { query: output.query },
    output,
  };
}

export function createMovieDetailsToolPart(
  output: ChatMovieDetailsOutput = mockChatMovieDetails,
  toolCallId = "tool-details-1",
): UIMessage["parts"][number] {
  return {
    type: "tool-getMovieDetails",
    toolCallId,
    state: "output-available",
    input: { imdbID: output.imdbID },
    output,
  };
}
