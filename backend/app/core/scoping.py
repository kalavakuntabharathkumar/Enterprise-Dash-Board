"""
Department-level data isolation utilities for Enterprise OS.

SEPARATION OF CONCERNS
  RBAC  (core/rbac.py)    — controls which modules/pages/actions a user can access
  Scoping (this file)     — controls which DATA ROWS are visible within those pages

SCOPE LEVELS (in descending visibility order)
  admin          — org-wide visibility across everything
  hr_manager     — org-wide HR + leave data; no privileged finance/ERP access
  dept_head      — employees & leave requests scoped to their own department
  finance_manager — finance data org-wide; HR employee list scoped to own record only
  employee       — own records only (leaves, profile)

RESOLUTION ORDER
  1. user.role == "admin"          → admin
  2. user.role_id set             → look up Role.name in DB
  3. user.role string fallback    → "hr_manager" / "finance_manager"
  4. Auto-detect dept head        → Employee.email == user.email AND Department.head == emp.name
  5. Default                      → employee
"""

from typing import Optional
from sqlalchemy.orm import Session


# ─── Internal helpers ─────────────────────────────────────────────────────────

_HR_ROLE_NAMES = {"hr manager", "hr_manager", "hr"}
_FINANCE_ROLE_NAMES = {"finance manager", "finance_manager"}
_DEPT_HEAD_ROLE_NAMES = {"department head", "dept_head"}
_ADMIN_ROLE_NAMES = {"admin", "super admin", "super_admin"}


def _resolve_dept_name(user, db: Session) -> Optional[str]:
    """Return the department name for a user via FK or linked Employee record."""
    from app import models

    if user.department_id:
        dept = (
            db.query(models.Department)
            .filter(models.Department.id == user.department_id)
            .first()
        )
        if dept:
            return dept.name

    emp = (
        db.query(models.Employee)
        .filter(models.Employee.email == user.email)
        .first()
    )
    return emp.department if emp else None


# ─── Public API ───────────────────────────────────────────────────────────────

def get_effective_scope(user, db: Session) -> dict:
    """
    Return a dict describing the user's effective data scope:
      {
        "level": "admin" | "hr_manager" | "dept_head" | "finance_manager" | "employee",
        "dept":  <department name string> | None,
      }

    This is the single authoritative place for scope resolution.
    All scoping helpers call this; never duplicate the logic elsewhere.
    """
    from app import models

    # ── 1. Admin role string (fast path) ─────────────────────────────────────
    if user.role == "admin":
        return {"level": "admin", "dept": None}

    # ── 2. RBAC role_id lookup ────────────────────────────────────────────────
    if user.role_id is not None:
        role = (
            db.query(models.Role)
            .filter(models.Role.id == user.role_id)
            .first()
        )
        if role:
            name_lower = role.name.lower().strip()
            if name_lower in _ADMIN_ROLE_NAMES:
                return {"level": "admin", "dept": None}
            if name_lower in _HR_ROLE_NAMES:
                return {"level": "hr_manager", "dept": None}
            if name_lower in _FINANCE_ROLE_NAMES:
                return {"level": "finance_manager", "dept": _resolve_dept_name(user, db)}
            if name_lower in _DEPT_HEAD_ROLE_NAMES:
                return {"level": "dept_head", "dept": _resolve_dept_name(user, db)}

    # ── 3. Legacy role string fallback ────────────────────────────────────────
    role_lower = (user.role or "").lower().strip()
    if role_lower in _HR_ROLE_NAMES:
        return {"level": "hr_manager", "dept": None}
    if role_lower in _FINANCE_ROLE_NAMES:
        return {"level": "finance_manager", "dept": _resolve_dept_name(user, db)}

    # ── 4. Auto-detect department head by employee name matching ──────────────
    emp = (
        db.query(models.Employee)
        .filter(models.Employee.email == user.email)
        .first()
    )
    if emp:
        dept = (
            db.query(models.Department)
            .filter(models.Department.head == emp.name)
            .first()
        )
        if dept:
            return {"level": "dept_head", "dept": dept.name}

    # ── 5. Default: regular employee ─────────────────────────────────────────
    dept_name = emp.department if emp else _resolve_dept_name(user, db)
    return {"level": "employee", "dept": dept_name}


def scope_employee_query(user, db: Session, query):
    """
    Filter an Employee SQLAlchemy query to only rows the user may see.

    admin / hr_manager      → unfiltered (full org)
    dept_head               → employees in their department only
    finance_manager         → their own employee record only (no cross-dept HR data)
    employee                → their own employee record only
    """
    from app import models

    scope = get_effective_scope(user, db)
    level = scope["level"]

    if level in ("admin", "hr_manager"):
        return query

    if level == "dept_head" and scope["dept"]:
        return query.filter(models.Employee.department == scope["dept"])

    # finance_manager and employee: own record only
    return query.filter(models.Employee.email == user.email)


def scope_leave_query(user, db: Session, query):
    """
    Filter a LeaveRequest SQLAlchemy query to only rows the user may see.

    admin / hr_manager      → unfiltered (full org)
    dept_head               → leaves for employees in their department only
    finance_manager         → their own leave requests only
    employee                → their own leave requests only
    """
    from app import models

    scope = get_effective_scope(user, db)
    level = scope["level"]

    if level in ("admin", "hr_manager"):
        return query

    if level == "dept_head" and scope["dept"]:
        dept_emp_ids = [
            e.id
            for e in db.query(models.Employee)
            .filter(models.Employee.department == scope["dept"])
            .all()
        ]
        return query.filter(models.LeaveRequest.employee_id.in_(dept_emp_ids))

    # finance_manager and employee: own leave requests
    emp = (
        db.query(models.Employee)
        .filter(models.Employee.email == user.email)
        .first()
    )
    if emp:
        return query.filter(models.LeaveRequest.employee_id == emp.id)

    # No employee record found — return empty result safely
    return query.filter(models.LeaveRequest.id == -1)


def can_access_department(user, department_name: str, db: Session) -> bool:
    """
    Return True if the user may view data belonging to the given department.

    admin / hr_manager → any department
    dept_head          → only their own department
    others             → False
    """
    scope = get_effective_scope(user, db)
    level = scope["level"]
    if level in ("admin", "hr_manager"):
        return True
    if level == "dept_head":
        return scope["dept"] == department_name
    return False


def is_same_department(user, target_email: str, db: Session) -> bool:
    """
    Return True if the target employee is in the same department as the user.
    Admin and HR manager always return True.
    """
    from app import models

    scope = get_effective_scope(user, db)
    if scope["level"] in ("admin", "hr_manager"):
        return True
    target_emp = (
        db.query(models.Employee)
        .filter(models.Employee.email == target_email)
        .first()
    )
    if not target_emp:
        return False
    return scope["dept"] == target_emp.department


def validate_leave_approval_scope(user, leave, db: Session) -> None:
    """
    Enforce that a dept_head may only approve/reject leave requests that
    belong to employees in their own department.

    Admin and HR Manager bypass this check entirely.
    Regular employees are always denied (they lack the approve_leave permission
    already, so this is a safety belt).

    Raises HTTP 403 on violation.
    """
    from fastapi import HTTPException

    scope = get_effective_scope(user, db)
    level = scope["level"]

    if level in ("admin", "hr_manager"):
        return

    if level == "dept_head" and scope["dept"]:
        from app import models

        emp = (
            db.query(models.Employee)
            .filter(models.Employee.id == leave.employee_id)
            .first()
        )
        if emp and emp.department != scope["dept"]:
            raise HTTPException(
                status_code=403,
                detail=(
                    f"Access denied: leave request belongs to '{emp.department}' "
                    f"but your department is '{scope['dept']}'."
                ),
            )
        return

    raise HTTPException(
        status_code=403,
        detail="Access denied: insufficient scope to approve or reject this leave request.",
    )
