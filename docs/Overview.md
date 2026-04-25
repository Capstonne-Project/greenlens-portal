# Overview — Dự án SU26SE049 (Web Frontend)

**Crowdsourced Application for Reporting Environmental Pollution**  
**Ứng dụng crowdsourcing báo cáo ô nhiễm môi trường (Web Frontend)**

> Tài liệu **tổng quan + kiến trúc frontend** cho capstone **SU26SE049** (dự án riêng, không tham chiếu codebase mẫu ngoài phạm vi đồ án).  
> Nội dung: cấu trúc thư mục, mô hình lớp L1–L6, **Business Rules v1.0**, performance, security, cấu hình lần đầu (TypeScript, ESLint, Prettier, Husky, Tailwind v4, Next, env).  
> **Cập nhật:** 2026-04-25. Đồng bộ BR v1.0 (17/04/2026) và đăng ký capstone (hạn 30/04/2026).

**Mục lục:** [1. Phạm vi](#1-phạm-vi-và-mục-tiêu) · [2. Tech stack](#2-tech-stack-cố-định) · [3. Cây thư mục SU26](#3-cây-thư-mục-chuẩn--su26se049) · [4. Mô hình L1–L6](#4-mô-hình-lớp-apil1--l6) · [5. Route & role](#5-route-groups--middleware-su26) · [6. API services & hooks](#6-libapi--hooks-theo-domain) · [7. Components](#7-quy-ước-components) · [8. RSC & App Router](#8-quy-tắc-rsc--app-router) · [9. State & DTO](#9-typescript--zustand--react-query) · [10. BR index](#10-business-rules-chỉ-mục-ánh-xạ-fe) · [11. Performance](#11-performance) · [12. Security](#12-security) · [13. Cấu hình lần đầu](#13-cấu-hình-lần-đầu-full-options) · [14. Clone & chốt](#14-thứ-tự-clone--setup) · [15. Anti-patterns](#15-anti-patterns--cấm) · [16. Tài liệu gốc](#16-tài-liệu-gốc-su26se049) · [Phụ lục A — globals.css](#phụ-lục-a-appglobalscss-chuẩn-tailwind-v4)

---

## 1. Phạm vi và mục tiêu

### 1.1 Đề tài (tóm tắt)

- Nền tảng crowdsourcing: công dân gửi báo cáo có **ảnh, GPS, mô tả**; theo dõi trạng thái; bản đồ / hotspot; minh bạch xử lý.
- **Actors:** Citizen, Environmental Officer, Cleanup Team, System Administrator, AI Service, Community Organization (optional).
- **NFR (đề tài):** hỗ trợ tối thiểu **5,000** người dùng đồng thời, mở rộng **100,000+** báo cáo; giao diện **mobile-friendly**.
- **Sản phẩm:** Web app (và mobile song song) + Backend API; AI xử lý qua tích hợp.
- **Gói công việc gợi ý:** (1) Citizen, (2) Officer, (3) Cleanup, (4) AI, (5) Admin.

### 1.2 Tài liệu nghiệp vụ

- **BR v1.0** — prefix: `BR-AUTH`, `BR-REP`, `BR-MAP`, `BR-OFF`, `BR-CLN`, `BR-NTF`, `BR-CMT`, `BR-GAM`, `BR-AI`, `BR-ADM`, `BR-DAT`, `BR-SYS`.
- Validation (Zod) + message lỗi ưu tiên **khớp cột Error Message** trong BR.
- Vòng đời báo cáo cốt lõi (**BR-REP-020**):  
  `Submitted` → `Verified` → `In Progress` → `Resolved` → `Closed`  
  Nhánh: `Submitted` → `Rejected` / `Verified` → `Duplicate` — màn hình & nút hành động theo **role** (ma trận quyền mục 2 file BR).

---

## 2. Tech stack (cố định)

| Layer               | Library                           | Version (min) | Ghi chú                                        |
| ------------------- | --------------------------------- | ------------- | ---------------------------------------------- |
| Framework           | `next`                            | `^15.5.7`     | App Router, RSC                                |
| UI                  | `react`, `react-dom`              | `^19.2.1`     |                                                |
| Language            | `typescript`                      | `^5.7.2`      | `strict: true`                                 |
| Styling             | `tailwindcss`                     | `^4.0.0`      | CSS-first `@theme`                             |
| PostCSS             | `@tailwindcss/postcss`            | `^4.0.0`      |                                                |
| UI kit              | shadcn/ui + Radix                 | latest        | `components.json` — `tailwind.config` **rỗng** |
| Animation           | `tw-animate-css`                  | latest        | thay `tailwindcss-animate` (v3)                |
| Data                | `@tanstack/react-query`           | `^5.x`        | server state                                   |
| State               | `zustand`                         | `^5.x`        | auth + UI                                      |
| HTTP                | `axios` + `ApiService`            | `^1.7.x`      | **một** singleton `lib/api/core.ts`            |
| Form                | RHF + zod + `@hookform/resolvers` | latest        |                                                |
| Realtime (tuỳ chọn) | `@microsoft/signalr`              | `^8.x`        | khi BE có hub                                  |
| Icons               | `lucide-react`                    | latest        | bật `optimizePackageImports`                   |
| Toasts              | `sonner`                          | `^2.x`        |                                                |
| Font                | `next/font/google` (Nunito)       | —             | `--font-nunito`                                |

**Quy tắc:** không tự ý upgrade/downgrade; mọi thay version qua review.

---

## 3. Cây thư mục chuẩn — SU26SE049

**Giữ tên thư mục cốt lõi** (`app`, `components/ui`, `lib/api`, `lib/providers`, `hooks`, `utils`) vì bám `components.json`, `tsconfig` paths, `next.config`.

```
project-root/
├── .cursor/
│   └── rules/
│       ├── cursorRules.mdc
│       └── FetchAndReactQuery.mdc
├── .github/
├── .husky/                              # pre-commit, commit-msg
├── .vscode/
├── app/
│   ├── (auth)/                          # /login, /register, /forgot-password, OTP, renew password
│   ├── (citizen)/                       # người dùng: map, report, profile, gamification
│   ├── (officer)/                       # /officer/* — xác minh, SLA, gán Cleanup
│   ├── (cleanup)/                       # /cleanup/* — task, check-in, before/after
│   ├── (admin)/                         # /admin/* — cấu hình, user, category, spam, template
│   ├── (community)/                     # (optional) open data, campaign, public map view
│   ├── api/                             # Route Handlers — validate zod, response chuẩn
│   ├── layout.tsx
│   ├── globals.css                      # Tailwind v4 + @theme (mục 13.5)
│   ├── robots.ts
│   ├── sitemap.ts
│   └── sitemap-dynamic.ts               # nếu cần
├── components/
│   ├── ui/                              # shadcn
│   ├── common/                          # header, sidebar, pagination
│   ├── features/                        # block lớn
│   ├── report/                          # form báo cáo, gallery, status, duplicate
│   ├── map/                             # bản đồ client — tách 'use client'
│   ├── officer/                         # queue, verify, assign
│   ├── cleanup/                         # task, check-in, ảnh
│   ├── gamification/                    # điểm, badge, leaderboard
│   ├── notification/                    # inbox
│   ├── auth/                            # login/register + CAPTCHA từ lần sai thứ 3 (BR-AUTH-011)
│   ├── providers/                       # app-level client
│   ├── seo/                             # JSON-LD (RSC)
│   └── widget/                          # widget nổi (nếu có)
├── hooks/                               # use<Domain>.ts + *Keys
├── lib/
│   ├── api/
│   │   ├── core.ts
│   │   ├── services/                    # fetch<Domain>.ts
│   │   └── data/
│   ├── config/
│   ├── constants/                       # enums, pollution categories, report status
│   ├── external/                        # map SDK wrapper, v.v.
│   ├── providers/                       # Query, Theme, Auth, Realtime, …
│   ├── realtime/                        # SignalR factory
│   ├── storage/
│   ├── store/                           # authStore, uiStore
│   └── utils/
├── utils/                               # pure, không React
├── public/
├── docs/
│   └── Overview.md                  # tổng quan dự án (file này)
├── middleware.ts
├── next.config.mjs
├── next-sitemap.config.js
├── postcss.config.mjs
├── tsconfig.json
├── components.json
├── .eslintrc.json
├── .prettierrc
├── commitlint.config.js
├── lint-staged.config.js
├── .env.example
└── package.json
```

**Phạm vi cây thư mục:** tổ chức theo nghiệp vụ báo cáo ô nhiễm — `report/`, `map/`, `officer/`, `cleanup/`, v.v. như trên (không áp mô hình thư mục của dự án khác).

---

## 4. Mô hình lớp API (L1 – L6)

| Lớp    | Trách nhiệm                                   | Vị trí                              | Quy tắc                                                 |
| ------ | --------------------------------------------- | ----------------------------------- | ------------------------------------------------------- |
| **L1** | HTTP singleton: base URL, header, 401, upload | `lib/api/core.ts`                   | Một instance; **không** gọi từ component (trừ rất hiếm) |
| **L2** | Service theo domain, DTO                      | `lib/api/services/fetch<Domain>.ts` | 1 file ≈ 1 domain; type khớp BE                         |
| **L3** | RSC / Server Actions                          | `app/**/page.tsx`                   | SEO, TTFB                                               |
| **L4** | React Query                                   | `hooks/use<Domain>.ts`              | Chỉ gọi L2; `queryKey` ổn định                          |
| **L5** | Zustand                                       | `lib/store/*`                       | Auth, UI — **không** cache list/detail API              |
| **L6** | UI                                            | `components/**`                     | Không import `apiService` trực tiếp                     |

**Luồng bắt buộc:** L1 (nội bộ) → L2 → L4 → L6. Zustand cắt ngang cho auth/theme, **không** thay React Query.

**Query keys:** factory `reportKeys`, `mapKeys`, … ở đầu từng `hooks/use<Domain>.ts` (ví dụ `reportKeys.detail(id)` — **không** nhét PII thừa).

### 4.1 Performance theo lớp (mở rộng + BR)

| Lớp | Nên                                                   | Tránh                                       | Gợi ý SU26 / BR                                                           |
| --- | ----------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------- |
| L1  | Timeout/retry hợp lý; batch nếu BE hỗ trợ             | Nhiều HTTP client                           | Map refresh **rate-limit** user (BR-MAP-012)                              |
| L2  | Phân trang, filter ổn định, typed                     | `any`                                       | Report list: nearby **5 km**, tối đa **100** điểm (BR-MAP-002)            |
| L3  | Fetch RSC; `loading.tsx`                              | `useEffect`+fetch thay RSC khi RSC làm được | Trang công khai / SEO                                                     |
| L4  | `staleTime` / `gcTime` / `enabled` / `select`         | Trùng query                                 | Cache map 10 phút (BR-MAP-012) — `staleTime: 10 * 60 * 1000` khi API khớp |
| L5  | State nhỏ, serializable                               | List report trong zustand                   | —                                                                         |
| L6  | `next/image`, `dynamic(..., { ssr: false })` map nặng | Cả trang `'use client'`                     | **BR-SYS-001** trang tải &lt; 3s 4G                                       |

### 4.2 Security theo lớp (mở rộng + BR)

| Lớp | Nên                                                              | Tránh / rủi ro               | BR liên quan                           |
| --- | ---------------------------------------------------------------- | ---------------------------- | -------------------------------------- |
| L1  | HTTPS; token/refresh một chỗ; 401 tập trung; không log full body | Secret trong repo            | **BR-DAT-001** mã hóa, TLS             |
| L2  | public vs protected endpoint rõ                                  | Gọi API nhạy cảm không guard | PII export (BR-OFF)                    |
| L3  | Secret **không** `NEXT_PUBLIC_`; Route Handler validate zod      | Lộ key client                |                                        |
| L4  | `queryKey` an toàn; refetch cân nhắc trên mạng công cộng         | PII trên `queryKey`          | —                                      |
| L5  | Logout xóa token + store                                         | Token tồn dư thừa thời hạn   | Session 24h / idle 30p web (BR-AUTH)   |
| L6  | Zod form; không `dangerouslySetInnerHTML` trừ sanitize           | HTML từ user thô             | Consent trước ảnh/GPS (**BR-DAT-005**) |

Ngoài lớp: `middleware` (mục 5), CORS/CSRF theo BE, audit dependency, **không** commit `.env*`.

---

## 5. Route groups & middleware (SU26)

### 5.1 Ánh xạ persona → `app/`

| Persona         | Group          | URL ví dụ                                 |
| --------------- | -------------- | ----------------------------------------- |
| Citizen         | `(citizen)/`   | `/`, `/map`, `/reports`, `/profile`       |
| Officer         | `(officer)/`   | `/officer/...`                            |
| Cleanup         | `(cleanup)/`   | `/cleanup/...`                            |
| Admin           | `(admin)/`     | `/admin/...`                              |
| Auth            | `(auth)/`      | `/login`, `/register`, `/forgot-password` |
| Community (opt) | `(community)/` | `/community/...`                          |

### 5.2 `middleware.ts` (auth, phân quyền, matcher)

1. **Auth routes** (`/login`, `/register`, `/forgot-password`, `/otp`, `/renew-password`) — nếu đã đăng nhập → redirect theo `role` (dashboard phù hợp).
2. **Protected:** `/admin/*`, `/officer/*`, `/cleanup/*` — thiếu token hợp lệ → `/login`.
3. **Role:** decode JWT (hoặc session) — Citizen không vào `/admin`; Officer không vào `/cleanup` nếu BE phân tách.
4. **matcher** loại trừ: `/api`, `/_next/static`, `/_next/image`, `favicon.ico`, `images`, `fonts`, `public assets`.
5. (Tuỳ chọn) Subdomain / rewrite **chỉ** khi dự án cần — mặc định SU26 có thể bỏ subdomain.

---

## 6. `lib/api` + hooks theo domain

### 6.1 `lib/api/services/` (1 file mỗi domain)

| File                   | Nội dung (BR)                                             |
| ---------------------- | --------------------------------------------------------- |
| `fetchAuth.ts`         | Đăng ký, login email/SĐT, OTP, session, profile (BR-AUTH) |
| `fetchReport.ts`       | Báo cáo, draft, trạng thái, media, duplicate (BR-REP)     |
| `fetchMap.ts`          | Nearby, filter, cache policy phía client (BR-MAP)         |
| `fetchOfficer.ts`      | Verify, ưu tiên, gán team, export (BR-OFF)                |
| `fetchCleanup.ts`      | Task, check-in, progress, resolve (BR-CLN)                |
| `fetchNotification.ts` | (BR-NTF)                                                  |
| `fetchComment.ts`      | (BR-CMT)                                                  |
| `fetchGamification.ts` | (BR-GAM)                                                  |
| `fetchAdmin.ts`        | (BR-ADM)                                                  |
| `fetchAiMetadata.ts`   | Đọc gợi ý/flag; **Officer quyết định cuối** (BR-AI-005)   |

Mỗi file: export types + hàm + `default` object; JSDoc ngắn.

### 6.2 `hooks/`

- `useAuth`, `useReport`, `useMap`, `useOfficer`, `useCleanup`, `useNotification`, `useComment`, `useGamification`, `useAdmin` — mỗi file có `*Keys`.
- **QueryClient defaults** (ở `lib/providers/queryProvider.tsx`):

```ts
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 3 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: process.env.NODE_ENV === 'production',
      retry: 1,
    },
    mutations: { retry: false },
  },
});
```

### 6.3 Ví dụ `fetchReport` (L2 — service)

```ts
import apiService from '../core';

export interface ReportListResponse {
  code: string;
  status: boolean;
  message?: string;
  data: { items: unknown[]; total: number };
}

export async function fetchReports(params?: Record<string, unknown>) {
  const res = await apiService.get<ReportListResponse>('/reports', params);
  return res.data;
}

export default { fetchReports };
```

---

## 7. Quy ước `components`

| Folder                                       | Vai trò           | `'use client'`                       |
| -------------------------------------------- | ----------------- | ------------------------------------ |
| `ui/*`                                       | shadcn            | Chỉ khi cần (dialog, select, …)      |
| `common/*`                                   | layout dùng chung | Tuỳ                                  |
| `report/`, `map/`, `officer/`, `cleanup/`, … | domain            | Thường client với tương tác map/form |
| `providers/*`                                |                   | Luôn client                          |
| `seo/*`                                      | JSON-LD           | Server                               |

**Islands:** page RSC fetch `initialData` → truyền xuống component client + `useQuery({ initialData })` hydrate.

---

## 8. Quy tắc RSC & App Router

- **Mặc định Server Component** — không thêm `'use client'` nếu không cần.
- **Chỉ** `'use client'` khi: hooks, browser API, event handler, RHF, React Query, Radix cần state, providers.
- **Không** `'use client'` ở root `layout`/`page` toàn trang nếu không cần SPA.
- Mỗi route có thể có `loading.tsx` (RSC), `error.tsx` (**client** + `reset`), `not-found.tsx`.
- **API Routes** `app/api/*`: `Response.json` / `NextResponse.json` + zod; format `{ code, status, message, data }` nếu FE dùng chung parser.

---

## 9. TypeScript & Zustand & React Query

- `strict: true`; tránh `any`.
- `interface` cho props/DTO; `type` cho union.
- Zustand: `authStore` + tối thiểu; sync cookie ↔ header ở action.
- **Không** cache danh sách báo cáo trong Zustand khi đã React Query.

---

## 10. Business Rules: chỉ mục ánh xạ FE

| Nhóm               | Module BR      | Gợi ý tích hợp UI / FE                                                               |
| ------------------ | -------------- | ------------------------------------------------------------------------------------ |
| Auth               | BR-AUTH        | Form register/login, OTP 10p, mật khẩu, điều khoản, lock sau 5 lần, CAPTCHA từ lần 3 |
| Báo cáo            | BR-REP         | Ảnh 1–5, video 1, GPS VN, draft tối đa 3, spam rate, vòng đời trạng thái, duplicate  |
| Bản đồ             | BR-MAP         | Mặc định vị trí / HCM, nearby, cluster, quyền riêng tư vị trí, rate refresh          |
| Officer            | BR-OFF         | Queue, SLA, gán team, export phạm vi, conflict of interest                           |
| Cleanup            | BR-CLN         | Task, check-in 200m, ảnh after, escalate                                             |
| NTF / CMT          | BR-NTF, BR-CMT | Inbox, giới hạn notify, bình luận + mod                                              |
| Gamification       | BR-GAM         | Điểm, level, badge, leaderboard; ẩn danh không tính                                  |
| AI                 | BR-AI          | Hiển thị gợi ý, flag, không thay quyền Officer                                       |
| Admin              | BR-ADM         | User, category, template, gamification, spam, audit                                  |
| Dữ liệu / hệ thống | BR-DAT, BR-SYS | Consent, performance gate API &lt; 2s p95, scale                                     |

**Trạng thái (UI cần guard nút theo role):** xem **BR-REP-020**, **BR-REP-021**.

---

## 11. Performance (checklist bắt buộc)

1. RSC mặc định; `'use client'` tối thiểu (mục 8).
2. `next/image` mọi ảnh user (báo cáo); kích thước rõ.
3. `next/font`; không link font ngoài thủ công.
4. `memo` / `useMemo` / `useCallback` khi đo render.
5. `dynamic` map, editor, chart nặng — `ssr: false` nếu cần.
6. `staleTime` dài cho dữ liệu ít đổi; map theo **BR-MAP-012** nếu API khớp.
7. `experimental.optimizePackageImports` cho `lucide-react` và thư viện lớn.
8. Build sạch warning; `npm run build` bắt buộc pass trước PR.
9. Cân nhắc `loading.tsx` / Suspense cho route nặng.
10. Đối chiếu **BR-SYS-001** (p95, TTFB) khi tối ưu.
11. (Tuỳ chọn) Mục tiêu Lighthouse mobile ≥ 90 (performance / a11y) trên trang chính và bản đồ — đo bằng Chrome DevTools / PageSpeed theo tiêu chí nhóm.

---

## 12. Security (checklist bắt buộc)

1. Chỉ HTTPS production; bí mật không vào `NEXT_PUBLIC_`.
2. Token/cookie: một luồng; 401 tập trung ở L1.
3. Mọi form: **zod** (đăng ký, báo cáo, từ chối, bình luận — khớp BR).
4. Route Handlers: validate toàn bộ input.
5. Không log header/body nhạy cảm.
6. Link ngoài: `rel="noopener noreferrer"`.
7. Không commit `.env*`.
8. Dependency audit định kỳ.
9. CORS/CSRF theo hợp đồng API.
10. Đồng bộ yêu cầu **BR-DAT** (mã hóa, lưu trữ) phía BE — FE không giả mạo quyền; middleware chỉ bổ trợ UX.

---

## 13. Cấu hình lần đầu (full options)

### 13.1 `tsconfig.json` (path alias)

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] },
    "target": "ES2017"
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

_(Tuỳ chọn tăng dần: `noUncheckedIndexedAccess`.)_

### 13.2 `components.json` (shadcn + Tailwind v4)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "zinc",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

### 13.3 `postcss.config.mjs`

```js
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
```

### 13.4 Tailwind v4 — cài gói

```bash
npm uninstall tailwindcss tailwindcss-animate @tailwindcss/line-clamp
npm install tailwindcss@^4 @tailwindcss/postcss@^4 tw-animate-css
```

- Xoá `tailwind.config.ts` chuyển từ v3.
- Dùng `@theme` + vars trong `app/globals.css` (mục 13.5).

### 13.5 `app/globals.css` — bản chuẩn (copy nguyên khi init)

**Nội dung đầy đủ** nằm ở **[Phụ lục A](#phụ-lục-a-appglobalscss-chuẩn-tailwind-v4)** cuối file (một mạch) — gồm: `@import 'tailwindcss'`, `tw-animate-css`, `@custom-variant dark`, `@theme` (font, radius, màu semantic shadcn), `:root` / `.dark`, `@layer base`, `@utility scrollbar-*`, `text-balance`.  
**Biến chiều cao header:** dùng `--app-header-height` trong Phụ lục A nếu layout cần.

**Bảng ánh xạ V3 → V4 (rút gọn, khi migrate từ dự án cũ):**

| Tailwind v3                                           | Tailwind v4                                       |
| ----------------------------------------------------- | ------------------------------------------------- |
| `tailwind.config.ts`                                  | Xoá; dùng `@theme` trong `app/globals.css`        |
| `darkMode: ['class']`                                 | `@custom-variant dark (&:where(.dark, .dark *));` |
| `theme.extend.colors` / `fontFamily` / `borderRadius` | `@theme { --color-…; --font-…; --radius-…; }`     |
| `@tailwind base; components; utilities`               | `@import "tailwindcss";`                          |
| `tailwindcss-animate`                                 | `tw-animate-css` (import trong CSS)               |
| `@tailwindcss/line-clamp`                             | Bỏ; dùng `line-clamp-*` built-in                  |
| `postcss` + `tailwindcss` + `autoprefixer`            | `@tailwindcss/postcss` (autoprefixer tích hợp)    |
| Plugin `addUtilities`                                 | `@utility name { }` trong CSS                     |

### 13.6 ESLint + Prettier + Husky

**`.eslintrc.json`**

```json
{
  "extends": [
    "next/core-web-vitals",
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "plugins": ["@typescript-eslint", "prettier"],
  "rules": {
    "prettier/prettier": "warn",
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

Nâng cấp khuyến nghị: `"plugin:react-hooks/recommended"`, `"@typescript-eslint/consistent-type-imports": "warn"`.

**`.prettierrc`**

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

**`lint-staged.config.js`**

```js
module.exports = {
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{json,md}': ['prettier --write'],
};
```

**`commitlint.config.js`:** `module.exports = { extends: ['gitmoji'] };`  
**Husky:** `pre-commit` → `npx lint-staged`; `commit-msg` → `npx commitlint --edit "$1"`.

### 13.7 `next.config.mjs` — mẫu đầy đủ tùy chọn lần đầu

```js
// @ts-check
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [{ protocol: 'https', hostname: 'your-cdn.example.com', pathname: '/**' }],
  },

  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', '@radix-ui/react-icons'],
  },

  // eslint: bật chặn build (không bật ignoreDuringBuilds production)
  // async headers() { return [{ source: '/:path*', headers: [ { key: 'X-Frame-Options', value: 'SAMEORIGIN' } ] }]; },
};

export default nextConfig;
```

Tùy chỉnh: `transpilePackages` khi cần; `remotePatterns` bắt buộc khớp CDN ảnh báo cáo.

### 13.8 `.env.example` (bản mẫu lần đầu)

```env
# —— App ——
NODE_ENV=development
NEXT_PUBLIC_APP_NAME=EcoReport
NEXT_PUBLIC_APP_URL=http://localhost:3000

# —— API (L1) ——
NEXT_PUBLIC_API_BASE_URL=https://api.example.com

# Bí mật chỉ server (Route Handlers / rewrites) — KHÔNG NEXT_PUBLIC_*
# API_REVALIDATE_SECRET=
# SENTRY_AUTH_TOKEN=

# —— Map (BR-MAP) ——
NEXT_PUBLIC_MAP_DEFAULT_CENTER=10.8231,106.6297
# NEXT_PUBLIC_GOOGLE_MAPS_KEY=
# Hoặc OSM/MapLibre tùy stack

# —— Hình ảnh (CDN / next/image) ——
NEXT_PUBLIC_CDN_BASE_URL=https://cdn.example.com

# —— Auth / feature ——
# NEXT_PUBLIC_ENABLE_ANONYMOUS_REPORT=true
# NEXT_PUBLIC_ENABLE_SIGNALR=false
```

Sao chép: `cp .env.example .env.local` (không commit `.env.local`).

### 13.9 `lib/providers` — nguyên tắc

File `lib/providers/index.tsx` compose providers: file cha **có thể** không `'use client'`; từng con (`queryProvider`, `themeProvider`, …) tự `'use client'`. Tránh gắn `'use client'` ở root layout không cần thiết.

### 13.10 Đặt tên (quy ước trong dự án)

- Folder: kebab-case. Route group: `(citizen)` …
- File hook: `useReport.ts`. Service: `fetchReport.ts`.
- Query key factory: `reportKeys`.
- Boolean: `is*`, `has*`, `should*`.

---

## 14. Thứ tự clone & setup

1. `npx create-next-app@latest <name> --typescript --app --no-tailwind --import-alias "@/*"`.
2. Cài dependencies theo mục [2](#2-tech-stack-cố-định) + mục [13.4](#13.4-tailwind-v4--cài-gói).
3. Thêm cấu trúc thư mục [3](#3-cây-thư-mục-chuẩn--su26se049).
4. Tạo `app/globals.css` từ **Phụ lục A** (cuối file Overview này); kèm `postcss.config.mjs`, `tsconfig`, `components.json`, ESLint/Prettier/Husky, `middleware.ts` (mục 5).
5. `shadcn` init theo `components.json`; thêm `lib/api/core.ts` + providers.
6. Tạo `.env.local` từ bản mẫu mục **13.8** (khối `.env.example` ở trên; không commit bí mật).
7. `npm run dev` — smoke.
8. `npm run build` — bắt buộc pass.
9. Mở PR nhánh feature (không push thẳng `main`).

---

## 15. Anti-patterns (cấm)

- `'use client'` lan tràn; fetch trong `useEffect` khi RSC xử lý được.
- Zustand cache dữ liệu server.
- `any` ở response API; gọi `axios` thẳng từ component.
- Style ngoài Tailwind / `globals` trừ khi có lý do.
- Sửa token theme bằng `tailwind.config` ở v4 — dùng `@theme`.
- Mở `images.remotePatterns` bừa bãi (wildcard CDN nguy hiểm).

---

## 16. Tài liệu gốc (SU26SE049)

- `SU26SE049_BusinessRules_v1.0.docx` — Business Rules.
- Form đăng ký / mô tả đề tài capstone (file `.docx` tương ứng trong repo, nếu có).
- **File Overview:** `docs/Overview.md` — bản này (tổng quan + kiến trúc FE + Phụ lục `globals.css`).
- `.cursor/rules/*.mdc` — quy ước AI (nếu dùng Cursor trong repo).

---

_Bản tổng quan dự án SU26SE049: cấu trúc, thiết kế, BR, performance, security, cấu hình lần đầu — dùng nội báo cáo và phát triển frontend._

---

## Phụ lục A: app/globals.css (chuẩn Tailwind v4)

Sao chép nguyên block sau vào `app/globals.css` khi khởi tạo frontend.

```css
/* ===== 1. Import Tailwind v4 ===== */
@import 'tailwindcss';

/* ===== 2. Plugin thay thế tailwindcss-animate ===== */
@import 'tw-animate-css';

/* ===== 3. Dark mode: class-based (thay darkMode: ['class'] của v3) ===== */
@custom-variant dark (&:where(.dark, .dark *));

/* ===== 4. Theme tokens — thay cho theme.extend trong v3 ===== */
@theme {
  /* Fonts */
  --font-sans: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
  --font-mann: var(--font-nunito), sans-serif;
  --font-urbanist: 'Urbanist', sans-serif;

  /* Radius */
  --radius: 0.5rem;
  --radius-lg: var(--radius);
  --radius-md: calc(var(--radius) - 2px);
  --radius-sm: calc(var(--radius) - 4px);

  /* Custom text scale */
  --text-tiny: 0.625rem;
  --text-tiny--line-height: 1.5rem;
  --text-tiny--letter-spacing: 0.125rem;
  --text-tiny--font-weight: 500;

  /* Semantic colors — ref tới CSS vars ở :root */
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));

  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));

  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));

  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));

  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));

  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));

  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));

  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));

  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));

  --color-chart-1: hsl(var(--chart-1));
  --color-chart-2: hsl(var(--chart-2));
  --color-chart-3: hsl(var(--chart-3));
  --color-chart-4: hsl(var(--chart-4));
  --color-chart-5: hsl(var(--chart-5));

  --color-sidebar: hsl(var(--sidebar-background));
  --color-sidebar-foreground: hsl(var(--sidebar-foreground));
  --color-sidebar-primary: hsl(var(--sidebar-primary));
  --color-sidebar-primary-foreground: hsl(var(--sidebar-primary-foreground));
  --color-sidebar-accent: hsl(var(--sidebar-accent));
  --color-sidebar-accent-foreground: hsl(var(--sidebar-accent-foreground));
  --color-sidebar-border: hsl(var(--sidebar-border));
  --color-sidebar-ring: hsl(var(--sidebar-ring));

  /* Background images (thay backgroundImage trong v3) */
  --background-image-gradient-radial: radial-gradient(var(--tw-gradient-stops));
  --background-image-gradient-conic: conic-gradient(
    from 180deg at 50% 50%,
    var(--tw-gradient-stops)
  );

  /* Custom animations */
  --animate-accordion-down: accordion-down 0.2s ease-out;
  --animate-accordion-up: accordion-up 0.2s ease-out;
}

@keyframes accordion-down {
  from {
    height: 0;
  }
  to {
    height: var(--radix-accordion-content-height);
  }
}
@keyframes accordion-up {
  from {
    height: var(--radix-accordion-content-height);
  }
  to {
    height: 0;
  }
}

/* ===== 5. CSS variables (light + dark) — giữ pattern shadcn ===== */
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;

  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;

  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;

  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;

  --secondary: 240 4.8% 95.9%;
  --secondary-foreground: 240 5.9% 10%;

  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;

  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;

  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;

  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: 240 10% 3.9%;

  --chart-1: 12 76% 61%;
  --chart-2: 173 58% 39%;
  --chart-3: 197 37% 24%;
  --chart-4: 43 74% 66%;
  --chart-5: 27 87% 67%;

  --sidebar-background: 0 0% 98%;
  --sidebar-foreground: 240 5.3% 26.1%;
  --sidebar-primary: 240 5.9% 10%;
  --sidebar-primary-foreground: 0 0% 98%;
  --sidebar-accent: 240 4.8% 95.9%;
  --sidebar-accent-foreground: 240 5.9% 10%;
  --sidebar-border: 220 13% 91%;
  --sidebar-ring: 217.2 91.2% 59.8%;

  --app-header-height: 90px;
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;

  --card: 240 10% 3.9%;
  --card-foreground: 0 0% 98%;

  --popover: 240 10% 3.9%;
  --popover-foreground: 0 0% 98%;

  --primary: 0 0% 98%;
  --primary-foreground: 240 5.9% 10%;

  --secondary: 240 3.7% 15.9%;
  --secondary-foreground: 0 0% 98%;

  --muted: 240 3.7% 15.9%;
  --muted-foreground: 240 5% 64.9%;

  --accent: 240 3.7% 15.9%;
  --accent-foreground: 0 0% 98%;

  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 0% 98%;

  --border: 240 3.7% 15.9%;
  --input: 240 3.7% 15.9%;
  --ring: 240 4.9% 83.9%;

  --chart-1: 220 70% 50%;
  --chart-2: 160 60% 45%;
  --chart-3: 30 80% 55%;
  --chart-4: 280 65% 60%;
  --chart-5: 340 75% 55%;

  --sidebar-background: 240 5.9% 10%;
  --sidebar-foreground: 240 4.8% 95.9%;
  --sidebar-primary: 224.3 76.3% 48%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 240 3.7% 15.9%;
  --sidebar-accent-foreground: 240 4.8% 95.9%;
  --sidebar-border: 240 3.7% 15.9%;
  --sidebar-ring: 217.2 91.2% 59.8%;
}

/* ===== 6. Base layer — global resets ===== */
@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground font-sans;
  }

  /* iOS: chống zoom khi focus input */
  @supports (-webkit-touch-callout: none) {
    input[type='text'],
    input[type='email'],
    input[type='password'],
    input[type='number'],
    input[type='tel'],
    input[type='url'],
    input[type='date'],
    input[type='time'],
    input[type='search'],
    textarea {
      font-size: max(16px, 1em);
    }
  }
}

/* ===== 7. Custom utilities (thay addUtilities plugin của v3) ===== */
@utility scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

@utility scrollbar-smooth {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
  transition: scrollbar-color 0.3s;

  &:hover {
    scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
  }
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background-color: transparent;
    border-radius: 20px;
    transition: background-color 0.3s;
  }
  &:hover::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.3);
  }
  &::-webkit-scrollbar-thumb:hover {
    background-color: rgba(156, 163, 175, 0.5);
  }
}

@utility text-balance {
  text-wrap: balance;
}
```
