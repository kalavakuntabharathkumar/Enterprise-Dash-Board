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
    emp_dept_map: dict[int, str] = {e.id: e.department for e in all_emps}  # employee_id → department

    # Leave requests in last 30 days (all, we filter per-dept below)
    recent_leaves = db.query(models.LeaveRequest).filter(
        models.LeaveRequest.created_at >= cutoff
    ).all()

    # Activity logs in last 30 days, joined to user → employee to get department
    # Build user_id → employee_department map
    all_users = db.query(models.User).all()
    user_email_map: dict[int, str] = {u.id: u.email for u in all_users}
    emp_email_dept: dict[str, str] = {e.email: e.department for e in all_emps}
    user_dept_map: dict[int, str] = {
        uid: emp_email_dept.get(email, "")
        for uid, email in user_email_map.items()
    }

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
    for l in recent_leaves:
        dept = emp_dept_map.get(l.employee_id, "")
        if dept:
            leave_by_dept[dept] = leave_by_dept.get(dept, 0) + 1

    # Activity: via actor_id → user.email → employee.department
    activity_by_dept: dict[str, int] = {}
    for a in recent_activity:
        if a.actor_id:
            dept = user_dept_map.get(a.actor_id, "")
            if dept:
                activity_by_dept[dept] = activity_by_dept.get(dept, 0) + 1

    # Docs: via document.department field
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


def get_department_export_rows(user, db: Session) -> list[dict]:
    scope = get_effective_scope(user, db)
    level = scope["level"]
    scope_dept = scope.get("dept")

    all_emps = db.query(models.Employee).all()
    if level == "dept_head" and scope_dept:
        all_emps = [e for e in all_emps if e.department == scope_dept]

    return [
        {
            "name": e.name,
            "email": e.email,
            "department": e.department,
            "position": e.position,
            "status": e.status,
            "joined_date": e.joined_date,
        }
        for e in all_emps
    ]
