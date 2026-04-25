---
domain: setup
mode: sprint
sprint: 0
created: 2026-04-25
status: in-progress
---

# Plan: Sprint 0 — Setup & Foundation

## Business Rules (indirect — enabling future sprints)

| BR                   | Constraint                         | FE Implementation                                                                  |
| -------------------- | ---------------------------------- | ---------------------------------------------------------------------------------- |
| BR-SYS-001           | Page load < 3s on 4G; API p95 < 2s | RSC default, `optimizePackageImports`, `next/font`, `next/image` formats webp/avif |
| BR-DAT-001           | TLS, encryption                    | Axios singleton with HTTPS base URL only, no secret in `NEXT_PUBLIC_*`             |
| BR-AUTH (foundation) | Session 24h / idle 30min           | Zustand authStore skeleton with logout-clears-token contract                       |
| BR-MAP-012           | Map cache 10min                    | QueryClient default `staleTime: 3 * 60 * 1000`; map-specific override later        |

## Phase 1 — Tooling & Dependencies

**Effort:** 2 giờ

- [ ] Verify Node >= 20.x
- [ ] Rename branch `master` -> `main` (per workflow rule)
- [ ] Install runtime deps:
  - [ ] `axios@^1.7`, `@tanstack/react-query@^5`, `zustand@^5`
  - [ ] `react-hook-form`, `zod`, `@hookform/resolvers`
  - [ ] `lucide-react`, `sonner@^2`, `tw-animate-css`
- [ ] Install Tailwind v4:
  - [ ] `npm uninstall tailwindcss tailwindcss-animate @tailwindcss/line-clamp` (if present)
  - [ ] `npm install tailwindcss@^4 @tailwindcss/postcss@^4 tw-animate-css`
- [ ] Install dev deps:
  - [ ] `prettier`, `eslint-config-prettier`, `eslint-plugin-prettier`
  - [ ] `husky`, `lint-staged`, `@commitlint/cli`, `commitlint-config-gitmoji`
  - [ ] `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`

## Phase 2 — Configuration Files

**Effort:** 2 giờ

- [ ] `tsconfig.json` — match section 13.1 (strict, paths `@/*`, ES2017)
- [ ] `postcss.config.mjs` — `@tailwindcss/postcss` only
- [ ] `app/globals.css` — copy Phụ lục A nguyên block (theme tokens, dark variant, scrollbar utilities)
- [ ] `next.config.mjs` — `reactStrictMode`, `poweredByHeader: false`, `images.formats`, `optimizePackageImports`
- [ ] `.eslintrc.json` (or merge into `eslint.config.mjs`) — match section 13.6
- [ ] `.prettierrc` — match section 13.6
- [ ] `lint-staged.config.js`
- [ ] `commitlint.config.js` — `extends: ['gitmoji']`
- [ ] `.env.example` — match section 13.8 (NEXT_PUBLIC_API_BASE_URL, MAP_DEFAULT_CENTER, CDN_BASE_URL)
- [ ] Update `.gitignore` — ensure `.env*` excluded except `.env.example`

## Phase 3 — Husky Hooks

**Effort:** 0.5 giờ

- [ ] `npx husky init`
- [ ] `.husky/pre-commit` -> `npx lint-staged`
- [ ] `.husky/commit-msg` -> `npx commitlint --edit "$1"`
- [ ] Manual smoke: stage a file -> commit -> verify hooks fire

## Phase 4 — shadcn/ui Init

**Effort:** 1 giờ

- [ ] `npx shadcn@latest init` with: `style: default`, `baseColor: zinc`, `cssVariables: true`, `tailwind.config: ""`
- [ ] Verify `components.json` matches section 13.2 (aliases: components, utils, ui, lib, hooks)
- [ ] Add baseline UI primitives:
  - [ ] `npx shadcn@latest add button input label dialog form sonner toast`
- [ ] Verify `components/ui/` populated; do not edit manually

## Phase 5 — L1: API Singleton

**Effort:** 2 giờ

- [ ] `lib/api/core.ts`
  - [ ] Axios instance with `baseURL: process.env.NEXT_PUBLIC_API_BASE_URL`
  - [ ] Request interceptor: attach `Authorization: Bearer <token>` from authStore
  - [ ] Response interceptor: 401 -> trigger logout + redirect `/login`
  - [ ] `apiService.get/post/put/patch/delete` typed wrappers
  - [ ] `apiService.upload(path, formData, onProgress)` for report photos
  - [ ] No token logging; no full-body logging in production
- [ ] `lib/api/services/.gitkeep` — placeholder for Sprint 1 services
- [ ] `lib/api/data/.gitkeep` — placeholder for fixtures/mocks

## Phase 6 — L5: Zustand Stores (skeleton)

**Effort:** 1.5 giờ

- [ ] `lib/store/authStore.ts`
  - [ ] State: `token`, `user`, `isAuthenticated`
  - [ ] Actions: `setAuth`, `logout` (clears token AND state)
  - [ ] No list/detail caching here (per architecture rule)
- [ ] `lib/store/uiStore.ts`
  - [ ] State: `theme: 'light' | 'dark'`, `sidebarOpen: boolean`
  - [ ] Actions: `toggleTheme`, `setSidebar`

## Phase 7 — Providers

**Effort:** 1.5 giờ

- [ ] `lib/providers/queryProvider.tsx` (`'use client'`)
  - [ ] QueryClient with defaults: `staleTime: 3*60*1000`, `gcTime: 10*60*1000`, `refetchOnWindowFocus: process.env.NODE_ENV === 'production'`, `retry: 1`, `mutations: { retry: false }`
- [ ] `lib/providers/themeProvider.tsx` (`'use client'`) — class-based dark via `.dark`
- [ ] `lib/providers/authProvider.tsx` (`'use client'`) — hydrate authStore from cookie/localStorage on mount
- [ ] `lib/providers/index.tsx` — compose Query + Theme + Auth (parent may stay server)
- [ ] Wire providers into `app/layout.tsx` minimally (do NOT add `'use client'` to layout itself)

## Phase 8 — Font & Layout

**Effort:** 0.5 giờ

- [ ] `app/layout.tsx`
  - [ ] `next/font/google` Nunito -> CSS var `--font-nunito`
  - [ ] `<html lang="vi">`, mount providers, `<Toaster />` (sonner)
- [ ] Smoke: `<body className="font-sans">` resolves Nunito

## Phase 9 — Middleware Skeleton

**Effort:** 1 giờ

- [ ] `middleware.ts`
  - [ ] Read token from cookie
  - [ ] Auth routes (`/login`, `/register`, `/forgot-password`, `/otp`, `/renew-password`): if authenticated -> redirect by role
  - [ ] Protected routes (`/admin/*`, `/officer/*`, `/cleanup/*`): no token -> `/login`
  - [ ] Role check: decode JWT (use `jose` or simple base64) — Citizen != admin/officer/cleanup
  - [ ] `matcher`: exclude `/api`, `/_next/static`, `/_next/image`, `favicon.ico`, `/images`, `/fonts`, public assets

## Phase 10 — Route Group Scaffold

**Effort:** 1 giờ

- [ ] Create empty route groups:
  - [ ] `app/(auth)/`
  - [ ] `app/(citizen)/`
  - [ ] `app/(officer)/`
  - [ ] `app/(cleanup)/`
  - [ ] `app/(admin)/`
- [ ] Each: drop a `.gitkeep` (real pages arrive in respective sprints)
- [ ] `app/robots.ts` and `app/sitemap.ts` minimal stub
- [ ] `components/seo/JsonLd.tsx` (RSC) — placeholder

## Phase 11 — Folder Skeleton

**Effort:** 0.5 giờ

- [ ] Create empty folders with `.gitkeep`:
  - [ ] `components/{common,features,report,map,officer,cleanup,gamification,notification,auth,widget}/`
  - [ ] `hooks/`
  - [ ] `lib/{config,constants,external,realtime,storage,utils}/`
  - [ ] `utils/`

## Phase 12 — CI/CD & Smoke

**Effort:** 1.5 giờ

- [ ] `.github/workflows/ci.yml` — install + lint + typecheck + build on PR to `main`
- [ ] `cp .env.example .env.local` (locally) with placeholder API URL
- [ ] `npm run dev` — verify localhost:3000 loads, no console errors, dark mode toggle (manual via class)
- [ ] `npm run build` — must pass with zero errors
- [ ] `npm run lint` — must pass

## Phase 13 — Documentation Touch

**Effort:** 0.5 giờ

- [ ] Update `README.md` with: setup steps, env file, scripts (`dev`, `build`, `lint`)
- [ ] Verify `docs/Overview.md` and `docs/PROJECT_HANDBOOK_SU26SE049.md` paths still valid
- [ ] No new `.md` unless user requests

## Total Effort: ~15.5 giờ (~2 working days)

## Thứ tự thực hiện (critical path)

1. **Phase 1 -> 2 -> 3** (tooling -> config -> hooks) — sequential, foundation
2. **Phase 4** (shadcn) — depends on Phase 2 (`globals.css`, `components.json`)
3. **Phase 5** (L1 core.ts) — depends on Phase 1 (axios installed)
4. **Phase 6 -> 7** (stores -> providers) — sequential; providers consume stores
5. **Phase 8** (layout + font) — depends on Phase 7
6. **Phase 9 -> 10** (middleware -> route groups) — sequential
7. **Phase 11** (skeleton folders) — can run parallel to anything
8. **Phase 12** (CI + smoke) — final gate
9. **Phase 13** (docs) — last

## Dependencies

- **BE:** none (Sprint 0 is FE-only foundation)
- **Shared:** all Sprint 1+ work depends on this sprint completing
- **Trước:** none (this is the first sprint)
- **External:** Node >= 20, npm registry access for deps

## Risks

| Risk                                                                        | Likelihood | Mitigation                                                                          |
| --------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------- |
| Tailwind v4 + shadcn integration friction                                   | Med        | Follow Phụ lục A and `components.json` exactly; empty `tailwind.config: ""`         |
| Husky hooks fail on Windows path                                            | Med        | Use forward slashes; test `npx lint-staged` manually post-install                   |
| `eslint.config.mjs` (flat) vs `.eslintrc.json` (legacy) conflict in Next 15 | Med        | Keep flat config; translate `.eslintrc.json` rules into flat format if needed       |
| `next/font/google` build network failure                                    | Low        | Cache fonts locally; document workaround                                            |
| Branch `master` vs `main` rename breaks remote                              | Low        | Run `git branch -m master main` then push with `-u origin main` after user confirms |
| Missing `optimizePackageImports` causes large bundle                        | Low        | Verify in Phase 12 build output                                                     |
