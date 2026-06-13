from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models
from app.core.security import get_current_user
from app.core.rbac import require_permission

router = APIRouter(prefix="/analytics", tags=["analytics"])


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
# so it only requires a valid login, not view_analytics permission
@router.get("/revenue-trend")
def get_revenue_trend(db: Session = Depends(get_db), _=Depends(get_current_user)):
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return [{"month": m, "revenue": round(95000 + i * 13000, 2), "expenses": round(60000 + i * 6500, 2)} for i, m in enumerate(months)]
