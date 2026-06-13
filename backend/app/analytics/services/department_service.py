"""Department analytics service — per-department operational metrics."""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app import models
from app.core.scoping import get_effective_scope


def get_department_analytics(user, db: Session) -> dict:
    scope = get_effective_scope(user, db)
    level = scope["level"]
    scope_dept = scope.get("dept")

    cutoff = datetime.utcnow() - timedelta(days=30)

    # Determine which departments to report on
    all_depts = db.query(models.Department).all()
    if level == "dept_head" and scope_dept:
        target_depts = [d for d in all_depts if d.name == scope_dept]
    else:
        # admin / hr_manager see all departments
        target_depts = all_depts

    # Pre-load data for efficiency
    all_emps = db.query(models.Employee).all()
    emp_dept_map: dict[int, str] = {e.id: e.department for e in all_emps}

    # Leave requests in last 30 days
    recent_leaves = db.query(models.LeaveRequest).filter(
        models.LeaveRequest.created_at >= cutoff
    ).all()

    # Build user_id → employee_department map via user.email → employee.email
    all_users = db.query(models.User).all()
    user_email_map: dict[int, str] = {u.id: u.email for u in all_users}
    emp_email_dept: dict[str, str] = {e.email: e.department for e in all_emps}
    user_dept_map: dict[int, str] = {
        uid: emp_email_dept.get(email, "")
        for uid, email in user_email_map.items()
    }

    # Activity logs in last 30 days — count per dept via actor_id → user.email → dept
    recent_activity = db.query(models.ActivityLog).filter(
        models.ActivityLog.timestamp >= cutoff
    ).all()

    # Document uploads in last 30 days
    recent_docs = db.query(models.Document).filter(
        models.Document.created_at >= cutoff
    ).all()

    # Aggregate per department
    # Leave: via employee_id → department
    leave_by_dept: dict[str, int] = {}
    for lr in recent_leaves:
        dept = emp_dept_map.get(lr.employee_id, "")
        if dept:
            leave_by_dept[dept] = leave_by_dept.get(dept, 0) + 1

    # Activity: via actor_id → user.email → employee.department (join-based, not text match)
    activity_by_dept: dict[str, int] = {}
    for a in recent_activity:
        if a.actor_id:
            dept = user_dept_map.get(a.actor_id, "")
            if dept:
                activity_by_dept[dept] = activity_by_dept.get(dept, 0) + 1

    # Docs: via document.department field (for dept-scoped docs)
    docs_by_dept: dict[str, int] = {}
    for d in recent_docs:
        dept = d.department or ""
        if dept:
            docs_by_dept[dept] = docs_by_dept.get(dept, 0) + 1

    # Count employees per department
    emp_count_by_dept: dict[str, int] = {}
    for e in all_emps:
        emp_count_by_dept[e.department] = emp_count_by_dept.get(e.department, 0) + 1

    departments = [
        {
            "department": d.name,
            "employee_count": emp_count_by_dept.get(d.name, 0),
            "leave_requests_30d": leave_by_dept.get(d.name, 0),
            "activity_count_30d": activity_by_dept.get(d.name, 0),
            "doc_uploads_30d": docs_by_dept.get(d.name, 0),
        }
        for d in target_depts
    ]

    return {
        "scope_dept": scope_dept,
        "departments": departments,
    }


def get_department_activity_export_rows(user, db: Session) -> list[dict]:
    """Export aggregated department metrics — NOT individual employee PII."""
    data = get_department_analytics(user, db)
    return data["departments"]
