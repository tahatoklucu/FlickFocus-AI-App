# FlickFocus 🎬

FlickFocus is a modern, high-performance web application for discovering movies, managing custom watchlists, and exploring detailed cinematic data. Built with Next.js App Router, Tailwind CSS, and OMDb API, featuring secure user authentication via Firebase.

## ✨ Features

- **Movie Discovery & Search:** Real-time search powered by the OMDb database with rich filtering and detailed modal views.
- **Cinematic UI/UX:** Dark-themed, streaming-platform-inspired design (Netflix/Apple TV+ style) featuring glassmorphism elements and responsive layouts.
- **Personal Watchlist & Favorites:** Secure user authentication allowing users to save and manage favorite movies.
- **FlickFocus AI Chat:** Streaming assistant with server-side OMDb tools and generative UI (rich movie cards rendered inline in chat).
- **Advanced SEO Optimization:** Fully configured metadata, Open Graph (OG) tags, Twitter cards, and semantic structure for maximum search engine visibility.

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **AI:** Vercel AI SDK (`ai`, `@ai-sdk/react`, `@ai-sdk/google`) with Zod-validated server-side tools
- **Authentication & Database:** Firebase Auth / Firestore
- **External API:** OMDb API
- **Deployment:** Vercel

## AI Tool Contract

FlickFocus exposes **server-side AI tools** on `POST /api/chat` via the Vercel AI SDK. Tools fetch live OMDb data during chat and stream results to the client as typed UI message parts (`tool-searchMovies`, `tool-getMovieDetails`). Each tool follows a strict input/output contract defined in `src/lib/chat-tools.ts` and `src/types/chat-tools.ts`.

### Tool lifecycle (client rendering)

Tool parts progress through four states. The chat UI maps each state to a distinct visual treatment in `src/components/chat/ChatToolLifecycle.tsx` (not raw JSON):

| State | UI treatment |
| --- | --- |
| `input-streaming` | Amber panel — parameters streaming in |
| `input-available` | Sky panel — confirmed input, server executing |
| `output-available` | Emerald panel — generative UI result |
| `output-error` | Red panel — safe error card (`ChatToolOutputError`) |

Orchestration and component routing live in `src/components/chat/ChatToolInvocation.tsx`.

---

### 1. `searchMovies`

**Purpose:** Search the OMDb catalog by title or keyword when the user wants to discover or look up films. Returns a ranked, capped result set for generative UI rendering.

**Server registration:** `flickFocusChatTools.searchMovies`  
**UI message part type:** `tool-searchMovies`

#### Zod input schema

```typescript
z.object({
  query: z
    .string()
    .min(1)
    .describe("Movie title or search keywords, e.g. Inception or sci-fi space"),
})
```

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `query` | `string` | Yes | Search string passed to OMDb (`s=`). Minimum length: 1. |

#### Return shape

```typescript
interface ChatMovieSearchOutput {
  query: string;
  results: ChatMovieSearchItem[];
  totalResults: number;
}

interface ChatMovieSearchItem {
  imdbID: string;
  title: string;
  year: string;
  poster: string;
  type: string;
}
```

| Field | Type | Description |
| --- | --- | --- |
| `query` | `string` | Echo of the submitted search query |
| `results` | `ChatMovieSearchItem[]` | Up to **6** ranked movie hits |
| `totalResults` | `number` | Total matches reported by OMDb (may exceed `results.length`) |

#### Generative UI component

| Output state | Component | Behavior |
| --- | --- | --- |
| `output-available` | `ChatMovieSearchResults` | Responsive poster grid; clicking a card opens `MovieDetailModal` |
| `output-error` | `ChatToolOutputError` | User-facing error message; chat session continues |

---

### 2. `getMovieDetails`

**Purpose:** Fetch full movie metadata and ratings for a specific title by IMDb ID. Used after a search or when the user asks for plot, cast, director, or scores.

**Server registration:** `flickFocusChatTools.getMovieDetails`  
**UI message part type:** `tool-getMovieDetails`

#### Zod input schema

```typescript
z.object({
  imdbID: z
    .string()
    .min(1)
    .describe("IMDb ID such as tt0133093 for The Matrix"),
})
```

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `imdbID` | `string` | Yes | OMDb identifier (e.g. `tt0133093`). Minimum length: 1. |

#### Return shape

```typescript
interface ChatMovieDetailsOutput {
  imdbID: string;
  title: string;
  year: string;
  rated: string | null;
  runtime: string | null;
  genre: string | null;
  director: string | null;
  actors: string | null;
  plot: string | null;
  poster: string | null;
  imdbRating: string | null;
  rottenTomatoes: string | null;
  metascore: string | null;
}
```

| Field | Type | Description |
| --- | --- | --- |
| `imdbID` | `string` | Canonical IMDb ID |
| `title` | `string` | Movie title |
| `year` | `string` | Release year |
| `rated` | `string \| null` | Content rating (e.g. PG-13); `null` if N/A |
| `runtime` | `string \| null` | Runtime string from OMDb; `null` if N/A |
| `genre` | `string \| null` | Comma-separated genres; `null` if N/A |
| `director` | `string \| null` | Director name(s); `null` if N/A |
| `actors` | `string \| null` | Cast listing; `null` if N/A |
| `plot` | `string \| null` | Synopsis; `null` if N/A |
| `poster` | `string \| null` | Poster URL; `null` if N/A |
| `imdbRating` | `string \| null` | IMDb score; `null` if N/A |
| `rottenTomatoes` | `string \| null` | Rotten Tomatoes score; `null` if unavailable |
| `metascore` | `string \| null` | Metacritic score; `null` if N/A |

#### Generative UI component

| Output state | Component | Behavior |
| --- | --- | --- |
| `output-available` | `ChatMovieDetailCard` | Poster, rating pills (IMDb / RT / Meta), genre chips, plot excerpt, director/cast info; “Open full details” opens `MovieDetailModal` |
| `output-error` | `ChatToolOutputError` | User-facing error message; chat session continues |

---

### Implementation reference

| Concern | Location |
| --- | --- |
| Tool definitions & `execute` | `src/lib/chat-tools.ts` |
| Output TypeScript types | `src/types/chat-tools.ts` |
| Chat API route | `src/app/api/chat/route.ts` |
| Tool lifecycle UI | `src/components/chat/ChatToolLifecycle.tsx` |
| Generative UI routing | `src/components/chat/ChatToolInvocation.tsx` |
| Chat integration | `src/components/ChatPageClient.tsx` |

**Error handling:** Tool `execute` functions throw on OMDb failures. The AI SDK surfaces these as `output-error` tool parts; the UI renders `ChatToolOutputError` instead of crashing the chat.

**Multi-step calls:** The chat route uses `stopWhen: isStepCount(5)` so the model may chain tools (e.g. `searchMovies` → `getMovieDetails`) within a single turn.

## Micro-interactions: Animated Action Button

FlickFocus includes a reusable **`AnimatedActionButton`** (`src/components/ui/AnimatedActionButton.tsx`) for stateful CTAs with compositor-friendly motion (transform + opacity only — no layout thrash).

### Visual states

| State | Behavior |
| --- | --- |
| `idle` | Default label; hover/focus lift via CSS (`translateY`, shadow) |
| `hover` / `focus` | Pseudo-state on `idle` — visible focus ring, subtle lift |
| `loading` | Cross-fade to spinner + label; clicks ignored (spam-safe) |
| `success` | Checkmark + label; optional auto-reset to `idle` |
| `error` | Shake animation, then **Retry** label; click invokes `onRetry` / re-runs `onAction` |

### Animation tokens

Defined in `src/lib/animated-action-button.ts` and implemented in `src/app/globals.css`:

| Token | Value | Usage |
| --- | --- | --- |
| State transition | **220ms** | `cubic-bezier(0.22, 1, 0.36, 1)` — layer cross-fades |
| Hover lift | **180ms** | `cubic-bezier(0.4, 0, 0.2, 1)` — button `translateY` / shadow |
| Success hold | **1200ms** | Before auto-reset (uncontrolled mode) |
| Error shake | **420ms** | `cubic-bezier(0.36, 0.07, 0.19, 0.97)` — horizontal `translateX` only |

### Accessibility

- Keyboard focusable with visible `focus-visible` ring
- `aria-busy` during loading; `aria-live="polite"` for state changes
- `@media (prefers-reduced-motion: reduce)` disables shake/spinner rotation/hover lift; opacity-only feedback remains

### Integration examples

| Location | Mode | Notes |
| --- | --- | --- |
| `/chat` send control | Controlled | Maps chat phase + error to button states |
| `/profile` demo panel | Controlled + uncontrolled | `AnimatedActionButtonDemo` for QA / capstone review |

## 🤖 AI-Assisted Development & Prompts

This project was developed independently using AI as an interactive development assistant (Claude / Gemini). Throughout the development process, AI was utilized for:
- Implementing robust SEO metadata architectures and sharing site constants.
- Refining complex UI components, such as the `MovieDetailModal` aspect ratios and responsive grid systems.
- Structuring modern navigation systems with glassmorphic styling and dropdown profile menus.

## 🏗️ System Architecture & Project Structure

FlickFocus is architected following the modern **Next.js App Router** paradigm, separating server-rendered layouts from interactive client components, with dedicated utility and context layers.

```text
FlickFocus/
├── src/
│   ├── app/                      # Next.js App Router pages & layouts
│   │   ├── layout.tsx            # Root layout with global SEO metadata & providers
│   │   ├── page.tsx              # Home / Discovery view
│   │   ├── favorites/            # Protected user favorites view
│   │   ├── profile/              # User settings and profile view
│   │   ├── chat/                 # FlickFocus AI chat (generative UI)
│   │   └── api/chat/             # Streaming chat API with server-side tools
│   ├── components/               # Modular UI building blocks
│   │   ├── chat/                 # Tool lifecycle & generative movie UI
│   │   ├── ui/                   # Shared UI primitives (AnimatedActionButton, Button)
│   │   ├── Header.tsx            # Glassmorphic sticky navbar & profile dropdown
│   │   ├── MovieDetailModal.tsx  # Cinematic detail view with responsive poster framing
│   │   └── ...                   # Cards, search bars, and shared UI elements
│   ├── context/                  # Global React Context providers (Auth & Favorites state)
│   └── lib/                      # Core configuration, API clients, and SEO helpers
│       ├── chat-tools.ts         # Zod schemas & OMDb tool execute functions
│       ├── site.ts               # Shared site constants and metadata defaults
│       └── metadata.ts           # Dynamic Open Graph & Twitter Card generators
├── public/                       # Static assets and icons
└── package.json                  # Dependencies and scripts