from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_employees = db.query(models.Employee).count()
    active_projects = db.query(models.Project).filter(models.Project.status == "active").count()
    open_leads = db.query(models.Lead).filter(models.Lead.stage.notin_(["closed_won", "closed_lost"])).count()
    total_revenue = db.query(func.sum(models.Invoice.amount)).filter(models.Invoice.status == "paid").scalar() or 0
    total_expenses = db.query(func.sum(models.Expense.amount)).scalar() or 0
    pending_invoices = db.query(models.Invoice).filter(models.Invoice.status.in_(["draft", "sent"])).count()
    return {
        "total_employees": total_employees,
        "total_revenue": round(total_revenue, 2),
        "active_projects": active_projects,
        "open_leads": open_leads,
        "total_expenses": round(total_expenses, 2),
        "pending_invoices": pending_invoices,
        "employee_growth": 8.2,
        "revenue_growth": 12.5,
    }


@router.get("/activity")
def get_dashboard_activity(db: Session = Depends(get_db)):
    notifications = db.query(models.Notification).order_by(models.Notification.created_at.desc()).limit(10).all()
    return [
        {"id": n.id, "type": n.type, "title": n.title, "description": n.message, "timestamp": str(n.created_at), "user": None}
        for n in notifications
    ]


@router.get("/charts")
def get_dashboard_charts(db: Session = Depends(get_db)):
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    revenue_monthly = [
        {"month": m, "revenue": round(120000 + i * 15000 + (i % 3) * 8000, 2), "expenses": round(80000 + i * 8000, 2)}
        for i, m in enumerate(months)
    ]
    tasks_by_status = [
        {"name": "To Do", "value": db.query(models.Task).filter(models.Task.status == "todo").count()},
        {"name": "In Progress", "value": db.query(models.Task).filter(models.Task.status == "in_progress").count()},
        {"name": "Done", "value": db.query(models.Task).filter(models.Task.status == "done").count()},
    ]
    leads_by_stage = [
        {"name": s.title().replace("_", " "), "value": db.query(models.Lead).filter(models.Lead.stage == s).count()}
        for s in ["prospecting", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"]
    ]
    expense_by_category = []
    cats = db.query(models.Expense.category, func.sum(models.Expense.amount)).group_by(models.Expense.category).all()
    for cat, total in cats:
        expense_by_category.append({"name": cat, "value": round(total or 0, 2)})
    return {
        "revenue_monthly": revenue_monthly,
        "tasks_by_status": tasks_by_status,
        "leads_by_stage": leads_by_stage,
        "expense_by_category": expense_by_category,
    }
