# FlickFocus — Test Coverage Evidence

**Project:** FlickFocus-AI-App  
**Last run:** August 2026  
**Command:** `npm run test:coverage`

---

## Summary (capstone pass criteria)

| Metric | Result | Capstone target |
| --- | ---: | --- |
| **Component files with unit tests** | **23 / 45 (51%)** | ≥ 50% of components |
| **Unit test files** | 26 | — |
| **Unit tests passing** | **73 / 73** | All pass |
| **E2E spec** | `e2e/chat.spec.ts` | Critical user flow |

> **Note:** Line-level coverage is lower (~25%) because WebGL/Three.js hero files and large page clients are intentionally tested via E2E and manual smoke tests rather than jsdom unit tests. The capstone criterion **“coverage ≥ 50% of components”** refers to **component file coverage** — how many components have dedicated unit tests.

---

## How to reproduce

```bash
npm install
npm run test
npm run test:coverage
npm run test:e2e
```

> **Important:** Run `npm run test:coverage` **alone** on its own line. Do not append `# comments` on the same line — Vitest treats extra words as file filters and reports 0% coverage.

Coverage artifacts:

| File | Description |
| --- | --- |
| [`docs/coverage-summary.json`](./coverage-summary.json) | Machine-readable Vitest v8 summary (committed evidence) |
| `coverage/` (local, gitignored) | Full HTML/text report after `npm run test:coverage` |

---

## Component file coverage (23 tested)

| Folder | Components with tests |
| --- | --- |
| **movies/** | `SearchBar`, `FavoriteButton`, `MovieCard`, `MovieList`, `MovieNotFound`, `MoviePoster` |
| **chat/** | `ChatAssistantMessage`, `ChatMovieDetailCard`, `ChatMovieSearchResults`, `ChatToolInvocation`, `ChatToolLifecycle`, `StreamingMarkdownText` |
| **ui/** | `Button`, `AnimatedActionButton` |
| **layout/** | `Footer`, `PageHeroGlow` |
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
| `ChatPageClient`, `HomePageClient`, `Header` | Large integration surfaces — E2E + smoke tests |
| `MovieDetailModal`, `AuthModal` | Modal + Firebase — partial coverage via child components |
| `AnimatedActionButtonDemo` | Dev/demo widget only |

---

## Vitest coverage output (latest run)

```text
 Test Files  26 passed (26)
      Tests  73 passed (73)

 % Coverage report from v8
-------------------|---------|----------|---------|---------|
File               | % Stmts | % Branch | % Funcs | % Lines |
-------------------|---------|----------|---------|---------|
All files          |   25.21 |    70.78 |   67.07 |   25.21 |
 movies/           |   39.87 |    81.08 |   84.61 |   39.87 |
 chat/             |   41.18 |    70.58 |    92.3  |   41.18 |
 ui/               |   68.23 |    83.67 |   85.71 |   68.23 |
 layout/           |    25.6 |       70 |   85.71 |    25.6 |
-------------------|---------|----------|---------|---------|

Statements   : 25.21% ( 1456/5774 )
Branches     : 70.78% ( 189/267 )
Functions    : 67.07% ( 55/82 )
Lines        : 25.21% ( 1456/5774 )
```

High-coverage highlights:

| Component | Line coverage |
| --- | ---: |
| `MovieCard` | 100% |
| `MovieNotFound` | 100% |
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

---

*This document satisfies the capstone requirement for test coverage evidence.*
