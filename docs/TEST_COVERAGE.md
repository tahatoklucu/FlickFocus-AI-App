# FlickFocus — Test Coverage Evidence

**Project:** FlickFocus-AI-App  
**Last run:** August 2026  
**Command:** `npm run test:coverage`

---

## Summary (capstone pass criteria)

| Metric | Result | Capstone target |
| --- | ---: | --- |
| **Component files with unit tests** | **29 / 56 (52%)** | ≥ 50% of components |
| **Unit test files** | 36 | — |
| **Unit tests passing** | **134 / 134** | All pass |
| **Firestore rule tests passing** | **26 / 26** | Security rules verified |
| **E2E spec** | `e2e/chat.spec.ts` | Critical user flow |

> **Note:** Line-level coverage is lower (~35%) because WebGL/Three.js hero files and large page clients are intentionally tested via E2E and manual smoke tests rather than jsdom unit tests. The capstone criterion **“coverage ≥ 50% of components”** refers to **component file coverage** — how many components have dedicated unit tests.

Firestore security rules are covered separately by emulator tests (`npm run test:rules`, config in [`vitest.rules.config.ts`](../vitest.rules.config.ts)). They are excluded from the component coverage figure because they test rules, not components.

---

## How to reproduce

```bash
npm install
npm run test
npm run test:coverage
npm run test:e2e
npm run test:rules      # requires a Java runtime for the Firestore emulator
```

> **Important:** Run `npm run test:coverage` **alone** on its own line. Do not append `# comments` on the same line — Vitest treats extra words as file filters and reports 0% coverage.

Coverage artifacts:

| File | Description |
| --- | --- |
| [`docs/coverage-summary.json`](./coverage-summary.json) | Machine-readable Vitest v8 summary (committed evidence) |
| `coverage/` (local, gitignored) | Full HTML/text report after `npm run test:coverage` |

---

## Component file coverage (29 tested)

| Folder | Components with tests |
| --- | --- |
| **movies/** | `SearchBar`, `FavoriteButton`, `MovieCard`, `MovieList`, `MovieNotFound`, `MoviePoster`, `MovieLibraryControls`, `PublicReviews`, `StarRating`, `WatchlistButton`, `SearchPagination` |
| **chat/** | `ChatAssistantMessage`, `ChatMovieDetailCard`, `ChatMovieSearchResults`, `ChatToolInvocation`, `ChatToolLifecycle`, `StreamingMarkdownText` |
| **ui/** | `Button`, `AnimatedActionButton` |
| **layout/** | `Footer`, `PageHeroGlow`, `Header` (profile menu) |
| **home/** | `HomePageLoading` |
| **hero/** | `CinemaHeroFallback`, `HomeHeroBackdropShell` |
| **profile/** | `UserAvatar` |
| **favorites/** | `FavoritesPageClient` |
| **common/** | `DeferredMount` |
| **providers/** | `FirebaseProviders` |

### Not unit-tested (by design or deferred)

| Component | Reason |
| --- | --- |
| `HeroShaderBackground`, `CinemaHeroScene`, Three.js stack | WebGL/GPU — covered by manual + Lighthouse audit |
| `ChatPageClient`, `HomePageClient` | Large integration surfaces — E2E + smoke tests |
| `MovieDetailModal`, `MovieDetailView`, `AuthModal` | Modal + Firebase — partial coverage via child components |
| `MovieTrailer` | Third-party embed (YouTube iframe) — verified manually in the browser |
| `LibraryLoading` | Static skeleton markup |
| `AnimatedActionButtonDemo` | Dev/demo widget only |

---

## Vitest coverage output (latest run)

```text
 Test Files  36 passed (36)
      Tests  134 passed (134)

 % Coverage report from v8
-------------------|---------|----------|---------|---------|
File               | % Stmts | % Branch | % Funcs | % Lines |
-------------------|---------|----------|---------|---------|
All files          |   34.78 |     77.7 |   72.84 |   34.78 |
 movies/           |   58.34 |    87.08 |    90.9 |   58.34 |
 layout/           |   88.88 |    63.63 |   55.55 |   88.88 |
 favorites/        |   66.09 |    72.72 |      50 |   66.09 |
 ui/               |   68.23 |    83.67 |   85.71 |   68.23 |
 chat/             |   38.97 |    70.58 |    92.3  |   38.97 |
-------------------|---------|----------|---------|---------|

Statements   : 34.78% ( 2490/7159 )
Branches     : 77.70% ( 366/471 )
Functions    : 72.84% ( 110/151 )
Lines        : 34.78% ( 2490/7159 )
```

High-coverage highlights:

| Component | Line coverage |
| --- | ---: |
| `MovieCard` | 100% |
| `MovieNotFound` | 100% |
| `StarRating` | 100% |
| `WatchlistButton` | 100% |
| `SearchPagination` | 100% |
| `MovieLibraryControls` | 98.89% |
| `PublicReviews` | 94.97% |
| `Button` | 100% |
| `StreamingMarkdownText` | 100% |
| `Footer` | 100% |
| `AnimatedActionButton` | 94.75% |
| `ChatToolLifecycle` | 94.26% |
| `MoviePoster` | 98.82% |

---

## E2E evidence

**File:** [`e2e/chat.spec.ts`](../e2e/chat.spec.ts)

**Flow tested:** Navigate to `/chat` → type message → submit → streamed assistant reply visible

**CI:** `.github/workflows/test.yml` runs Playwright after unit tests + build.

---

## Related lib tests (non-component)

| File | Tests |
| --- | ---: |
| `src/lib/api/api-limits.test.ts` | 4 |
| `src/lib/chat/chat-tools.test.ts` | 3 |
| `src/lib/poster/poster-url.test.ts` | 3 |
| `src/lib/library-entry.test.ts` | 12 |
| `src/lib/public-review.test.ts` | 5 |
| `src/lib/library-tabs.test.ts` | 2 |
| `src/lib/home-search-params.test.ts` | 10 |
| `firestore-tests/firestore.rules.test.ts` | 26 (emulator) |

---

*This document satisfies the capstone requirement for test coverage evidence.*
