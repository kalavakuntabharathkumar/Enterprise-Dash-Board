import io
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models
from app.core.security import get_current_user
from app.core.rbac import require_permission
from app.core.scoping import get_effective_scope

router = APIRouter(prefix="/analytics", tags=["analytics"])


# ── Existing endpoints (unchanged) ────────────────────────────────────────────

@router.get("/overview")
def get_analytics_overview(
    db: Session = Depends(get_db),
    _=Depends(require_permission("view_analytics")),
):
    total_employees = db.query(models.Employee).count()
    total_revenue = db.query(func.sum(models.Invoice.amount)).filter(models.Invoice.status == "paid").scalar() or 0
    active_projects = db.query(models.Project).filter(models.Project.status == "active").count()
    conversion = db.query(models.Lead).filter(models.Lead.stage == "closed_won").count()
    total_leads = db.query(models.Lead).count()
    conv_rate = round((conversion / total_leads * 100) if total_leads > 0 else 0, 1)
    kpis = [
        {"label": "Total Revenue", "value": f"${total_revenue:,.0f}", "change": 12.5, "trend": "up"},
        {"label": "Total Employees", "value": str(total_employees), "change": 8.2, "trend": "up"},
        {"label": "Active Projects", "value": str(active_projects), "change": 3.1, "trend": "up"},
        {"label": "Lead Conversion", "value": f"{conv_rate}%", "change": -2.4, "trend": "down"},
    ]
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    performance = [{"month": m, "revenue": round(100000 + i * 14000 + (i % 3) * 5000, 2), "expenses": round(65000 + i * 7000, 2)} for i, m in enumerate(months)]
    return {"kpis": kpis, "performance": performance}


@router.get("/department-stats")
def get_department_stats(
    db: Session = Depends(get_db),
    _=Depends(require_permission("view_analytics")),
):
    depts = db.query(models.Department).all()
    result = []
    for d in depts:
        count = db.query(models.Employee).filter(models.Employee.department == d.name).count()
        result.append({"department": d.name, "employees": count, "performance": round(72 + len(d.name) % 20, 1), "budget_used": round(55 + len(d.name) % 35, 1)})
    return result


# revenue-trend is also used by the Dashboard page (accessible to all authenticated users)
@router.get("/revenue-trend")
def get_revenue_trend(db: Session = Depends(get_db), _=Depends(get_current_user)):
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return [{"month": m, "revenue": round(95000 + i * 13000, 2), "expenses": round(60000 + i * 6500, 2)} for i, m in enumerate(months)]


# ── New scoped analytics endpoints ────────────────────────────────────────────

@router.get("/hr")
def get_hr_analytics(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """HR analytics — scoped by role. Admin + hr_manager see full org data."""
    scope = get_effective_scope(current_user, db)
    if scope["level"] not in ("admin", "hr_manager", "dept_head"):
        raise HTTPException(status_code=403, detail="HR analytics requires HR Manager or higher access.")
    from app.analytics.services.hr_service import get_hr_analytics
    return get_hr_analytics(current_user, db)


@router.get("/finance")
def get_finance_analytics(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Finance analytics — admin and finance_manager only."""
    scope = get_effective_scope(current_user, db)
    if scope["level"] not in ("admin", "finance_manager"):
        raise HTTPException(status_code=403, detail="Finance analytics requires Finance Manager or Admin access.")
    from app.analytics.services.finance_service import get_finance_analytics
    return get_finance_analytics(db)


@router.get("/department")
def get_department_analytics(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Department metrics — scoped. Admin/HR see all depts; dept_head sees own dept."""
    scope = get_effective_scope(current_user, db)
    if scope["level"] == "employee":
        raise HTTPException(status_code=403, detail="Department analytics requires Department Head or higher access.")
    from app.analytics.services.department_service import get_department_analytics
    return get_department_analytics(current_user, db)


@router.get("/activity")
def get_activity_analytics(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Activity feed analytics — admin/hr_manager see org-wide; others see own activity."""
    from app.analytics.services.activity_service import get_activity_analytics
    return get_activity_analytics(current_user, db)


@router.get("/documents")
def get_document_analytics(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Document upload analytics — scoped by visibility rules."""
    from app.analytics.services.documents_service import get_document_analytics
    return get_document_analytics(current_user, db)


# ── CSV Export endpoints ───────────────────────────────────────────────────────

@router.get("/export/hr")
def export_hr_report(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Export scoped HR leave report as CSV."""
    scope = get_effective_scope(current_user, db)
    if scope["level"] not in ("admin", "hr_manager", "dept_head"):
        raise HTTPException(status_code=403, detail="HR export requires HR Manager or higher access.")
    from app.analytics.services.hr_service import get_hr_export_rows
    from app.analytics.utils.csv_export import dicts_to_csv
    rows = get_hr_export_rows(current_user, db)
    csv_str = dicts_to_csv(rows, ["employee_name", "department", "leave_type", "start_date", "end_date", "status", "reason", "submitted_at"])
    return StreamingResponse(
        io.StringIO(csv_str),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=hr-leave-report.csv"},
    )


@router.get("/export/leaves")
def export_leave_analytics(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Export leave analytics CSV (alias of hr export with same scoping)."""
    scope = get_effective_scope(current_user, db)
    if scope["level"] not in ("admin", "hr_manager", "dept_head"):
        raise HTTPException(status_code=403, detail="Leave export requires HR Manager or higher access.")
    from app.analytics.services.hr_service import get_hr_export_rows
    from app.analytics.utils.csv_export import dicts_to_csv
    rows = get_hr_export_rows(current_user, db)
    csv_str = dicts_to_csv(rows, ["employee_name", "department", "leave_type", "start_date", "end_date", "status", "submitted_at"])
    return StreamingResponse(
        io.StringIO(csv_str),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=leave-analytics.csv"},
    )


@router.get("/export/department")
def export_department_report(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Export department employee roster as CSV (scoped)."""
    scope = get_effective_scope(current_user, db)
    if scope["level"] == "employee":
        raise HTTPException(status_code=403, detail="Department export requires Department Head or higher access.")
    from app.analytics.services.department_service import get_department_export_rows
    from app.analytics.utils.csv_export import dicts_to_csv
    rows = get_department_export_rows(current_user, db)
    csv_str = dicts_to_csv(rows, ["name", "email", "department", "position", "status", "joined_date"])
    return StreamingResponse(
        io.StringIO(csv_str),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=department-report.csv"},
    )
