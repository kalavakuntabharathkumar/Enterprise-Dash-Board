# Enterprise OS

A unified enterprise operating system covering HR, CRM, ERP, Finance, Projects, Analytics, AI Copilot, Workflow Automation, Document Management, and Notifications — all in one platform with role-based access control and department-scoped data visibility.

> **Status:** Prototype / Enterprise Architecture Demonstration Project

---

## Core Modules

| Module | Description |
|---|---|
| **HRMS** | Employee directory, departments, attendance tracking, leave management |
| **CRM** | Lead pipeline, contact management, deals kanban board |
| **ERP** | Inventory management, vendor directory, purchase orders |
| **Finance** | Revenue summary, invoice tracking, expense management |
| **Projects** | Project cards, task kanban by status, milestones |
| **Analytics** | KPI metrics, department stats, revenue trend charts |
| **AI Copilot** | Context-aware chat assistant per module |
| **Workflow Automation** | Trigger-based automation cards with run tracking |
| **Document Management** | Scoped document storage with visibility controls |
| **Notifications** | Role-targeted notification inbox |
| **Activity Tracking** | Audit feed of user and system actions |
| **RBAC** | Role and permission management with department isolation |

---

## Tech Stack

### Frontend
- React 19 + TypeScript
- Vite (build tool)
- Tailwind CSS v4 + Shadcn UI
- TanStack Query (server state)
- Zustand (client state)
- React Hook Form + Zod (validation)
- Recharts (charts)
- react-router-dom v7

### Backend
- Python 3.11 + FastAPI
- SQLAlchemy ORM
- SQLite (file-based, zero-config)
- JWT authentication (`python-jose`)
- PBKDF2/SHA-256 password hashing (`hashlib`)
- Uvicorn (ASGI server)

### Shared
- OpenAPI 3.0 spec (`lib/api-spec/openapi.yaml`) — source of truth for the API
- Orval — generates TanStack Query hooks and Zod schemas from the spec
- pnpm workspaces (monorepo)
- uv (Python environment manager)

---

## Security Features

- **JWT authentication** — stateless tokens, 7-day expiry, signed with a required `SECRET_KEY` env var
- **RBAC** — role and permission tables; middleware enforces permissions per endpoint
- **Scoped access control** — data visibility filtered by department membership
- **Department isolation** — employees see only their own department's data where applicable
- **Password hashing** — PBKDF2-SHA256 via `hashlib` (no third-party dependency)
- **No credentials in CORS** — `Authorization` header-based auth; wildcard origin is safe

---

## Features

- Personalized dashboards with role-scoped KPI cards and activity feeds
- Multi-step workflow approvals (leave requests, purchase orders)
- Scoped analytics — admins see org-wide data; employees see department data
- CSV export for employees, leads, attendance, and contacts (admin only)
- Document visibility controls (private / department / public)
- In-app notifications with role targeting
- Activity feed with user attribution and timestamps
- AI Copilot with module-specific context; graceful fallback if API keys are absent

---

## Setup

### Prerequisites
- Node.js 20+ and pnpm
- Python 3.11 and [uv](https://github.com/astral-sh/uv)

### Backend

```bash
cd backend
cp .env.example .env          # fill in SECRET_KEY at minimum
uv run uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

The database is created and seeded automatically on first startup. Delete `backend/enterprise_os.db` to reset.

### Frontend

```bash
pnpm install
cd artifacts/enterprise-os
pnpm dev
```

The Vite dev server proxies `/api` requests to the backend at `http://localhost:8080`.

### API codegen (after spec changes)

```bash
pnpm --filter @workspace/api-spec run codegen
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SECRET_KEY` | **Yes** | JWT signing key — generate with `openssl rand -hex 32` |
| `ENTERPRISE_DB_URL` | No | SQLite path. Default: `sqlite:///./enterprise_os.db` |
| `OPENROUTER_API_KEY` | No | AI Copilot via OpenRouter/DeepSeek |
| `GEMINI_API_KEY` | No | AI Copilot fallback via Google Gemini |

See `backend/.env.example` for a copy-paste template.

> **Replit:** `SECRET_KEY` is pre-configured in the Replit environment. No `.env` file is needed when running on Replit.

---

## Demo Credentials

| Role | Email | Password | Access |
|---|---|---|---|
| Admin | `admin@enterpriseos.com` | `admin123` | Full access to all 10 modules |
| Employee | `employee@enterpriseos.com` | `employee123` | Dashboard, Projects, Leave, AI Copilot, Notifications, Settings |

---

## Architecture Highlights

### Modular backend
Each domain (HRMS, CRM, Finance, etc.) is an isolated FastAPI router under `backend/app/api/routes/`. Adding a module means adding a router — no changes to other modules required.

### Scoped APIs
`backend/app/core/scoping.py` centralises data-visibility logic. Routers call scope helpers rather than writing raw filters, keeping access control consistent and auditable.

### Reusable widget system
Frontend dashboard widgets are independent components keyed to the auth context. Swapping a widget or adding a new KPI card requires no changes to layout or routing.

### Analytics architecture
Analytics queries are separated from CRUD routers. Aggregate endpoints return pre-computed summaries so the frontend never performs client-side aggregation over raw records.

### SQLite compatibility
The entire system runs on SQLite with no external database dependency — suitable for demos and single-server deployments. Schema migrations are applied via guarded `ALTER TABLE` statements on startup.

### Replit compatibility
- `SECRET_KEY` resolved from Replit's shared environment (`[userenv.shared]` in `.replit`)
- `ENTERPRISE_DB_URL` avoids collision with Replit's managed `DATABASE_URL`
- Both workflows (frontend port 5000, backend port 8080) start in parallel via `.replit` workflow config

---

## Project Structure

```
.
├── artifacts/
│   └── enterprise-os/          # React frontend
│       └── src/
│           ├── pages/          # Route-level page components
│           ├── components/     # Shared UI components
│           └── lib/            # Auth context, utilities
├── backend/
│   ├── app/
│   │   ├── api/routes/         # FastAPI routers (one per domain)
│   │   ├── core/               # Auth, security, scoping, config
│   │   ├── models.py           # SQLAlchemy models
│   │   └── main.py             # App entry point + startup seeding
│   └── .env.example
├── lib/
│   ├── api-spec/               # OpenAPI 3.0 spec (source of truth)
│   ├── api-client-react/       # Generated TanStack Query hooks
│   └── api-zod/                # Generated Zod schemas
└── README.md
```
