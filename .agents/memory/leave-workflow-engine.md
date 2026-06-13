---
name: Leave Workflow Engine
description: Architecture and gotchas for the leave approval workflow (pending_department → pending_hr → approved/rejected)
---

## State machine

```
pending_department →(approve)→ pending_hr →(approve)→ approved
pending_department →(reject)→  rejected
pending_hr         →(reject)→  rejected
```

Legacy "pending" status (pre-workflow leaves) treated as "pending_department" in TRANSITIONS dict.

## Module layout

- `backend/app/workflows/service.py` — `LeaveWorkflowService.submit()`, `.action()`, `.get_logs()`
- `backend/app/notifications/service.py` — `NotificationService.create()`
- `backend/app/api/routes/leaves.py` — `POST /{id}/action` (approve_leave perm), `GET /{id}/logs`

## Critical gotcha: ORM model must reflect ALTER TABLE columns

When adding columns via `ALTER TABLE` in the migration block, the SQLAlchemy model class MUST also declare those columns. The DB column exists but if the Python model class doesn't have it, SQLAlchemy raises `TypeError: 'column_name' is an invalid keyword argument`.

**Affected models:**
- `LeaveRequest`: added `current_approver_role`, `created_at`, `updated_at` to both DB and model
- `Notification`: added `user_id` to both DB and model

## Migration pattern (main.py)

Each ALTER TABLE is guarded by per-table `PRAGMA table_info(tbl)` checks. Cache results per table to avoid redundant PRAGMAs. Tuple format: `(table, column, sql)`.

**Why:** The original code checked only `users` table columns, so migrations on other tables always attempted to run (relying on non-fatal catch). New pattern is idempotent and silent.

## Permission: `approve_leave`

Granted to: admin (legacy), hr_manager, department_head roles via RBAC. `require_permission("approve_leave")` returns the current User — use as `current_user=Depends(require_permission("approve_leave"))` when you need the actor's identity.
