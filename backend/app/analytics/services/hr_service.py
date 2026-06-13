"""HR analytics service — computes real metrics from the DB, scoped by role."""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import text
from app import models
from app.core.scoping import get_effective_scope, scope_employee_query, scope_leave_query


def get_hr_analytics(user, db: Session) -> dict:
    scope = get_effective_scope(user, db)
    level = scope["level"]

    # ── Headcount by department (scoped) ──────────────────────────────────────
    emp_q = db.query(models.Employee)
    emp_q = scope_employee_query(user, db, emp_q)
    all_emps = emp_q.all()

    dept_counts: dict[str, int] = {}
    for e in all_emps:
        dept_counts[e.department] = dept_counts.get(e.department, 0) + 1
    headcount_by_dept = [{"department": k, "count": v} for k, v in sorted(dept_counts.items())]

    active_count = sum(1 for e in all_emps if e.status == "active")
    on_leave_count = sum(1 for e in all_emps if e.status == "on_leave")

    # ── Pending approvals (scoped) ─────────────────────────────────────────────
    leave_q = db.query(models.LeaveRequest)
    leave_q = scope_leave_query(user, db, leave_q)
    all_leaves = leave_q.all()

    pending_statuses = {"pending_department", "pending_hr", "pending"}
    pending_count = sum(1 for l in all_leaves if l.status in pending_statuses)

    # ── Approval turnaround (approved/rejected only) ──────────────────────────
    resolved = [l for l in all_leaves if l.status in ("approved", "rejected") and l.created_at and l.updated_at]
    if resolved:
        deltas = [(l.updated_at - l.created_at).total_seconds() / 86400 for l in resolved]
        avg_days = round(sum(deltas) / len(deltas), 1)
    else:
        avg_days = 0.0

    # ── Monthly leave trends (last 12 months) ─────────────────────────────────
    cutoff = datetime.utcnow() - timedelta(days=365)
    recent_leaves = [l for l in all_leaves if l.created_at and l.created_at >= cutoff]

    month_status: dict[str, dict] = {}
    for l in recent_leaves:
        m = l.created_at.strftime("%Y-%m")
        if m not in month_status:
            month_status[m] = {"approved": 0, "rejected": 0, "pending": 0}
        if l.status == "approved":
            month_status[m]["approved"] += 1
        elif l.status == "rejected":
            month_status[m]["rejected"] += 1
        else:
            month_status[m]["pending"] += 1

    # Fill last 12 months (even with 0s)
    leave_trends = []
    now = datetime.utcnow()
    for i in range(11, -1, -1):
        d = now.replace(day=1) - timedelta(days=i * 30)
        m = d.strftime("%Y-%m")
        label = d.strftime("%b %Y")
        stats = month_status.get(m, {"approved": 0, "rejected": 0, "pending": 0})
        leave_trends.append({"month": label, **stats})

    return {
        "active_employees": active_count,
        "on_leave_count": on_leave_count,
        "pending_approvals": pending_count,
        "avg_turnaround_days": avg_days,
        "headcount_by_dept": headcount_by_dept,
        "leave_trends": leave_trends,
    }


def get_hr_export_rows(user, db: Session) -> list[dict]:
    """Returns leave requests as exportable rows (scoped)."""
    leave_q = db.query(models.LeaveRequest)
    leave_q = scope_leave_query(user, db, leave_q)
    all_leaves = leave_q.all()

    emp_map = {e.id: e for e in db.query(models.Employee).all()}
    rows = []
    for l in all_leaves:
        emp = emp_map.get(l.employee_id)
        rows.append({
            "employee_name": emp.name if emp else "Unknown",
            "department": emp.department if emp else "",
            "leave_type": l.type,
            "start_date": l.start_date,
            "end_date": l.end_date,
            "status": l.status,
            "reason": l.reason or "",
            "submitted_at": l.created_at.strftime("%Y-%m-%d") if l.created_at else "",
        })
    return rows
