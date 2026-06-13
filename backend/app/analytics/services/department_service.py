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
    elif level == "employee":
        # Employees see only their own department metrics
        target_depts = [d for d in all_depts if d.name == scope_dept] if scope_dept else []
    else:
        target_depts = all_depts

    # Pre-load all data for efficiency
    all_emps = db.query(models.Employee).all()
    all_leaves = db.query(models.LeaveRequest).filter(
        models.LeaveRequest.created_at >= cutoff
    ).all()
    all_activity = db.query(models.ActivityLog).filter(
        models.ActivityLog.timestamp >= cutoff
    ).all()
    all_docs = db.query(models.Document).filter(
        models.Document.created_at >= cutoff
    ).all()

    # Build employee dept map
    emp_dept: dict[str, list] = {}
    for e in all_emps:
        emp_dept.setdefault(e.department, []).append(e)

    # Build leave dept map (via employee department)
    emp_id_to_dept = {e.id: e.department for e in all_emps}
    leave_dept_counts: dict[str, int] = {}
    for l in all_leaves:
        dept = emp_id_to_dept.get(l.employee_id, "")
        if dept:
            leave_dept_counts[dept] = leave_dept_counts.get(dept, 0) + 1

    # Activity by actor_role (best approximation for dept filtering)
    activity_role_counts: dict[str, int] = {}
    for a in all_activity:
        r = a.actor_role or "unknown"
        activity_role_counts[r] = activity_role_counts.get(r, 0) + 1

    # Doc uploads by department
    doc_dept_counts: dict[str, int] = {}
    for d in all_docs:
        dept = d.department or "General"
        doc_dept_counts[dept] = doc_dept_counts.get(dept, 0) + 1

    departments = []
    for d in target_depts:
        emp_list = emp_dept.get(d.name, [])
        departments.append({
            "department": d.name,
            "employee_count": len(emp_list),
            "leave_requests_30d": leave_dept_counts.get(d.name, 0),
            "activity_count_30d": sum(
                1 for a in all_activity
                if a.description and d.name.lower() in a.description.lower()
            ),
            "doc_uploads_30d": doc_dept_counts.get(d.name, 0),
        })

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
