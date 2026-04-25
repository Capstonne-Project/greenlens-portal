<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

---

# SU26SE049 — Multi-Agent System

Project này dùng hệ thống **sub-agents chuyên biệt** để tối ưu context window. Mỗi agent chỉ load rules liên quan đến domain của nó.

## Agent Registry

| Agent                | Trigger khi nào                                 | Rules được load                                                |
| -------------------- | ----------------------------------------------- | -------------------------------------------------------------- |
| `scaffold-agent`     | Tạo file/folder mới theo cấu trúc chuẩn         | architecture.md, typescript.md                                 |
| `api-layer-agent`    | Viết/sửa L1 `core.ts` hoặc L2 `fetchDomain.ts`  | architecture.md, data-fetching.md, security.md                 |
| `hook-agent`         | Viết/sửa L4 `useDomain.ts` và query keys        | data-fetching.md, typescript.md                                |
| `component-agent`    | Viết/sửa L6 components, island pattern          | components.md, typescript.md, performance.md                   |
| `form-agent`         | Viết form RHF + Zod schema khớp BR              | business-rules.md, security.md, typescript.md                  |
| `middleware-agent`   | Viết/sửa `middleware.ts`, route guards          | architecture.md, security.md, business-rules.md                |
| `styling-agent`      | Tailwind v4, globals.css, @theme tokens         | styling.md, anti-patterns.md                                   |
| `review-agent`       | Review code trước PR — anti-patterns + security | anti-patterns.md, security.md, performance.md, git-workflow.md |
| `br-validator-agent` | Kiểm tra UI logic có khớp Business Rules không  | business-rules.md, architecture.md                             |

## Cách dùng

Orchestrator (agent chính) nhận request của user → xác định domain → spawn đúng sub-agent với context tối thiểu.

```
User: "viết hook để fetch danh sách báo cáo"
→ Orchestrator spawn hook-agent (chỉ load data-fetching.md + typescript.md)
→ hook-agent trả về useReport.ts hoàn chỉnh
→ Orchestrator không cần load toàn bộ CLAUDE.md
```
