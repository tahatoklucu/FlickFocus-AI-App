# FlickFocus 🎬

FlickFocus is a modern, high-performance web application for discovering movies, managing custom watchlists, and exploring detailed cinematic data. Built with Next.js App Router, Tailwind CSS, and OMDb API, featuring secure user authentication via Firebase.

## ✨ Features

- **Movie Discovery & Search:** Real-time search powered by the OMDb database with rich filtering and detailed modal views.
- **Cinematic UI/UX:** Dark-themed, streaming-platform-inspired design (Netflix/Apple TV+ style) featuring glassmorphism elements and responsive layouts.
- **Personal Watchlist & Favorites:** Secure user authentication allowing users to save and manage favorite movies.
- **Advanced SEO Optimization:** Fully configured metadata, Open Graph (OG) tags, Twitter cards, and semantic structure for maximum search engine visibility.

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **Authentication & Database:** Firebase Auth / Firestore
- **External API:** OMDb API
- **Deployment:** Vercel

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
│   │   └── profile/              # User settings and profile view
│   ├── components/               # Modular UI building blocks
│   │   ├── Header.tsx            # Glassmorphic sticky navbar & profile dropdown
│   │   ├── MovieDetailModal.tsx  # Cinematic detail view with responsive poster framing
│   │   └── ...                   # Cards, search bars, and shared UI elements
│   ├── context/                  # Global React Context providers (Auth & Favorites state)
│   └── lib/                      # Core configuration, API clients, and SEO helpers
│       ├── site.ts               # Shared site constants and metadata defaults
│       └── metadata.ts           # Dynamic Open Graph & Twitter Card generators
├── public/                       # Static assets and icons
└── package.json                  # Dependencies and scripts