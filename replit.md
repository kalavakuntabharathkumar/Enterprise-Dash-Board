# Enterprise OS

A complete enterprise SaaS platform — one command center for HR, CRM, ERP, Finance, Projects, Analytics, AI Copilot, and Workflow Automation.

## Run & Operate

- Frontend (enterprise-os): starts automatically via workflow on port 22209, served at `/`
- Backend (API server): starts automatically via workflow on port 8080, served at `/api`
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm run typecheck` — full TypeScript check

## Stack

### Frontend (`artifacts/enterprise-os`)
- React + TypeScript + Vite + Tailwind CSS + Shadcn UI
- react-router-dom v6 (nested routes, protected routes)
- Zustand, React Hook Form, Zod
- Recharts (charts and analytics)
- TanStack Query + generated hooks from `@workspace/api-client-react`

### Backend (`backend/`)
- Python FastAPI + SQLAlchemy (SQLite)
- Custom PBKDF2 password hashing (hashlib — no passlib/bcrypt due to v5 incompatibility)
- JWT via `python-jose`
- uvicorn at `/home/runner/workspace/.pythonlibs/bin/uvicorn`

### Shared libraries
- `lib/api-spec/` — OpenAPI 3.0 spec (source of truth)
- `lib/api-client-react/` — generated TanStack Query hooks + custom-fetch
- `lib/zod/` — generated Zod schemas

## Where things live

- OpenAPI spec: `lib/api-spec/openapi.yaml`
- Python backend: `backend/app/` (models.py, main.py, api/routes/*)
- Frontend pages: `artifacts/enterprise-os/src/pages/`
- Frontend components: `artifacts/enterprise-os/src/components/`
- Auth context: `artifacts/enterprise-os/src/lib/auth.tsx`
- DB file: `backend/enterprise_os.db` (SQLite, auto-seeded on startup)

## Architecture decisions

- Python FastAPI replaces the Node.js api-server artifact — same artifact.toml, different run command
- PBKDF2 (hashlib) used for password hashing instead of bcrypt — passlib 1.7.4 is incompatible with bcrypt 5.0.0 (detect_wrap_bug sends 72+ byte test string, which bcrypt 5 rejects)
- `@workspace/api-client-react/custom-fetch` is a named subpath export — must be listed in package.json `exports` field
- DB auto-seeds on startup if tables are empty — delete `backend/enterprise_os.db` to reset
- `ENTERPRISE_DB_URL` env var used instead of `DATABASE_URL` to avoid PostgreSQL workspace env var conflict
- API prefix `/api` is in the Python routes, not in uvicorn — matches the proxy routing

## Product

10 fully wired modules:
1. **Dashboard** — KPI cards, activity feed, revenue/expense charts
2. **HRMS** — Employee directory, profiles, departments, attendance, leave management
3. **CRM** — Lead pipeline, contacts, deals kanban board
4. **ERP** — Inventory/products, vendors, purchase orders
5. **Finance** — Revenue summary, invoices, expense tracking
6. **Projects** — Project cards, task kanban by status, milestones
7. **Analytics** — KPI metrics, department stats, revenue trend charts
8. **AI Copilot** — Chat interface with suggested prompts, falls back to contextual responses
9. **Workflow Automation** — Automation cards with trigger functionality
10. **Settings/Notifications** — User management, notification inbox

## Default credentials

- Email: `admin@enterpriseos.com`
- Password: `admin123`

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Never use `passlib`/`bcrypt` for password hashing — use hashlib PBKDF2 (see architecture decisions)
- Delete `backend/enterprise_os.db` before restarting if seed schema changes
- `ENTERPRISE_DB_URL` (not `DATABASE_URL`) is the env var for the SQLite path
- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec changes
- The api-client-react `./custom-fetch` subpath must stay in `exports` in package.json
