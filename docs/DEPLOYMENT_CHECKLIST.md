# FlickFocus — Deployment Checklist (FE-11)

**Project:** FlickFocus-AI-App (`nextjs-ai-app`)  
**Platform:** Vercel  
**Production URL:** [https://flickfocus.vercel.app](https://flickfocus.vercel.app)  
**Last verified:** August 2026  
**Signed off by:** Intern capstone submission

---

## 1. Pre-deployment

| # | Item | Status | Notes |
| --- | --- | :---: | --- |
| 1.1 | `npm run lint` passes locally | ✅ | ESLint clean |
| 1.2 | `npm run test` passes locally | ✅ | 73 unit tests (26 files) |
| 1.3 | `npm run build` succeeds locally | ✅ | Next.js 16 production build |
| 1.4 | `.env.local` never committed | ✅ | Listed in `.gitignore` |
| 1.5 | Secrets stored in Vercel (not in repo) | ✅ | Server + client vars separated |
| 1.6 | CI pipeline green (`.github/workflows/test.yml`) | ✅ | Lint → test → build → E2E |

---

## 2. Environment variables (Vercel)

Configure under **Project → Settings → Environment Variables** for **Production** and **Preview**.

| Variable | Required | Scope | Set in Vercel | Verified |
| --- | --- | --- | :---: | :---: |
| `NEXT_PUBLIC_OMDB_API_KEY` | Yes | Client + Server | ✅ | ✅ |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes | Client | ✅ | ✅ |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | Client | ✅ | ✅ |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes | Client | ✅ | ✅ |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Yes | Client | ✅ | ✅ |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes | Client | ✅ | ✅ |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Yes | Client | ✅ | ✅ |
| `NEXT_PUBLIC_FIREBASE_USE_STORAGE` | No | Client | ✅ | ✅ |
| `NEXT_PUBLIC_APP_URL` | Recommended | Client | ✅ | ✅ `https://flickfocus.vercel.app` |
| `GOOGLE_GENERATIVE_AI_API_KEY` | For chat | **Server only** | ✅ | ✅ |

**Rules:**

- `GOOGLE_GENERATIVE_AI_API_KEY` must **not** be prefixed with `NEXT_PUBLIC_`
- After changing env vars → **Redeploy** (Vercel does not hot-reload secrets)
- Preview deployments should use the same keys or isolated Firebase project (team choice)

---

## 3. Domain & DNS

| # | Item | Status | Details |
| --- | --- | :---: | --- |
| 3.1 | Production domain assigned | ✅ | `flickfocus.vercel.app` |
| 3.2 | `NEXT_PUBLIC_APP_URL` matches production domain | ✅ | Used for OG/metadata |
| 3.3 | HTTPS enforced (Vercel default) | ✅ | Automatic TLS |
| 3.4 | Custom domain (optional) | — | Not configured; Vercel subdomain used |

---

## 4. Firebase rules & backend

| # | Item | Status | Command / file |
| --- | --- | :---: | --- |
| 4.1 | Firestore rules reviewed | ✅ | `firestore.rules` |
| 4.2 | Storage rules reviewed | ✅ | `storage.rules` |
| 4.3 | Rules deployed to Firebase project | ✅ | `npm run firebase:deploy` |
| 4.4 | Auth providers enabled (Email + Google) | ✅ | Firebase Console |
| 4.5 | Authorized domains include production URL | ✅ | Firebase Console → Authentication → Settings |

**Deploy Firebase rules:**

```bash
npm run firebase:login          # one-time
npm run firebase:deploy         # firestore + storage rules
```

Config: `firebase.json` → `firestore.rules`, `storage.rules`

---

## 5. Build & deploy (Vercel)

| # | Item | Status | Notes |
| --- | --- | :---: | --- |
| 5.1 | Repo connected to Vercel (GitHub) | ✅ | Push to `main` triggers deploy |
| 5.2 | Build command | ✅ | `npm run build` (default) |
| 5.3 | Output | ✅ | Next.js App Router (serverless functions for `/api/*`) |
| 5.4 | Node.js version | ✅ | 22 (matches CI) |
| 5.5 | Production deploy successful | ✅ | [flickfocus.vercel.app](https://flickfocus.vercel.app) |

**Manual redeploy:** Vercel Dashboard → Deployments → latest → **Redeploy**

---

## 6. Post-deploy smoke tests

Run after every production deployment.

| # | Test | URL / action | Expected | Status |
| --- | --- | --- | --- | :---: |
| 6.1 | Homepage loads | `/` | Hero, search bar, movie grid render | ✅ |
| 6.2 | OMDb health check | `/health-check` | **System Status: OK** + sample result | ✅ |
| 6.3 | Movie search | `/` → search "Inception" | Results grid updates | ✅ |
| 6.4 | Genre chip browse | `/` → click genre chip | Curated genre results | ✅ |
| 6.5 | Movie detail modal | Click any movie card | Modal opens with poster, plot, ratings | ✅ |
| 6.6 | AI chat | `/chat` → send message | Streamed reply; tool cards if triggered | ✅ |
| 6.7 | Auth sign-in | Header → Sign in | Firebase auth modal works | ✅ |
| 6.8 | Favorites (authenticated) | Add favorite → `/favorites` | Movie appears in list | ✅ |
| 6.9 | Profile | `/profile` | Settings load for signed-in user | ✅ |
| 6.10 | Error page | Invalid route | Branded 404 (`not-found.tsx`) | ✅ |
| 6.11 | API rate limit (optional) | Rapid `/api/chat` calls | Eventually `429` with `Retry-After` | ✅ |

**Quick smoke script (manual):**

```text
1. Open https://flickfocus.vercel.app
2. Open https://flickfocus.vercel.app/health-check  → confirm OK
3. Search "Matrix" on homepage                       → results appear
4. Open /chat → send "Recommend a sci-fi film"       → assistant replies
5. Sign in → add a favorite → verify on /favorites
```

---

## 7. How the app fails safely

| Failure | User-facing behaviour |
| --- | --- |
| OMDb down / timeout | Search/detail shows friendly error message |
| Missing `GOOGLE_GENERATIVE_AI_API_KEY` | Chat returns 503; rest of app works |
| Firebase not configured | Lazy placeholder auth; config message shown |
| Broken poster URL | Placeholder image; no console 404 spam |
| Invalid chat payload | 400 with validation message |
| Rate limit hit | 429 with retry guidance |
| Unhandled runtime error | `error.tsx` boundary with recovery option |

See README → [Error States & Resilience](../README.md#error-states--resilience).

---

## 8. Rollback plan

**Primary method — Vercel instant rollback (recommended):**

1. Open [Vercel Dashboard](https://vercel.com) → **FlickFocus** project
2. Go to **Deployments**
3. Find the **last known-good deployment** (green, previously smoke-tested)
4. Click **⋯** (menu) → **Promote to Production** (or **Instant Rollback**)
5. Confirm — traffic switches within seconds (no rebuild required)
6. Re-run smoke tests (§6) on production URL

**Secondary method — Git revert:**

```bash
git revert <bad-commit-sha>
git push origin main
# Vercel auto-deploys the reverted commit
```

**When to rollback:**

- Production build succeeds but critical smoke test fails (search, auth, chat)
- Lighthouse score drops sharply after a deploy
- API routes return unexpected 5xx across all pages

**Firebase rules rollback:**

- Revert `firestore.rules` / `storage.rules` in Git
- Run `npm run firebase:deploy` from the known-good commit

---

## 9. Monitoring & observability

| Method | What it covers | Status |
| --- | --- | :---: |
| Vercel deployment logs | Build failures, function errors | ✅ Available |
| Vercel Analytics (optional) | Web vitals, traffic | — Optional add-on |
| `/health-check` | OMDb connectivity | ✅ Built-in |
| GitHub Actions CI | Lint, test, build, E2E on push | ✅ `.github/workflows/test.yml` |
| Lighthouse audit | Performance & a11y regression | ✅ [docs/AUDIT.md](./AUDIT.md) |

**No dedicated APM** (Datadog/Sentry) in scope for this capstone. Vercel logs + CI + health-check page are the operational baseline.

---

## 10. Known limitations (production)

- In-memory rate limiting is per serverless instance (not distributed Redis)
- OMDb free tier has daily request limits
- Chat requires Gemini API key; app degrades gracefully without it
- Lighthouse HTML report should be re-run after major hero/shader changes

See README → [Reflection](../README.md#reflection) and [docs/AUDIT.md](./AUDIT.md) §8 Future Recommendations.

---

## 11. Sign-off

| Role | Name | Date | Signature |
| --- | --- | --- | --- |
| Developer (Intern) | Taha Toklucu | August 2026 | ✅ Checklist complete |

**Declaration:** I confirm that FlickFocus is deployed to production at [https://flickfocus.vercel.app](https://flickfocus.vercel.app), environment variables are configured in Vercel, Firebase rules are deployed, smoke tests pass, and I know how to roll back via Vercel → Deployments → Promote previous deployment.

---

*This checklist satisfies the FE-11 production deployment requirement for the internship capstone.*
