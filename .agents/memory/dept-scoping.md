---
name: Department Scoping System
description: How department-level data isolation works in Enterprise OS — scope levels, resolution order, test users, and key design decisions.
---

## Rule
`backend/app/core/scoping.py` is the single source of truth for data visibility.
RBAC (`core/rbac.py`) controls page/action access; scoping controls which rows are returned.
Never duplicate scope logic in routes — always call `scope_employee_query` / `scope_leave_query`.

## Scope levels (descending visibility)
- `admin` — full org
- `hr_manager` — org-wide employees + leaves
- `dept_head` — own department only (employees + leaves)
- `finance_manager` — own employee record only (no cross-dept HR data)
- `employee` — own records only

## Resolution order in `get_effective_scope(user, db)`
1. `user.role == "admin"` → admin
2. `user.role_id` → look up `Role.name` in DB (HR Manager, Finance Manager, Department Head, Admin)
3. `user.role` string fallback (hr_manager, finance_manager)
4. Auto-detect dept head: `Employee.email == user.email` AND `Department.head == emp.name`
5. Default → employee

## Routes scoped
- `GET /api/employees` — `scope_employee_query` applied
- `GET /api/employees/stats` — scoped (uses same helper)
- `GET /api/employees/{id}` — 403 if user lacks dept/own access
- `GET /api/leaves` — `scope_leave_query` applied
- `POST /api/leaves/{id}/action` — `validate_leave_approval_scope` blocks cross-dept approvals with HTTP 403

## Test credentials (all seeded in main.py TEST_USERS)
- Admin: admin@enterpriseos.com / admin123
- HR Manager: hr@enterpriseos.com / hr1234
- Finance Manager: finance@enterpriseos.com / finance123
- Dept Head (Engineering): sarah.chen@co.com / dept1234
- Dept Head (Sales): marcus.j@co.com / dept1234
- Employee: employee@enterpriseos.com / employee123

**Why:** Finance Manager test user (Frank Finance) has no Employee record seeded, so employee count = 0 is correct; in production every user would have an Employee record.

## Key design decision
`Employee.department` is a string matching `Department.name` — scoping joins happen via string equality, not FK. This preserves the existing schema without a migration.
