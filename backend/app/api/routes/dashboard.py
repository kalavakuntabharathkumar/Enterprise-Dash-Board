from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _pct_change(curr: float, prev: float) -> float:
    """Safe percentage change; 0.0 when prev is 0."""
    if prev == 0:
        return 0.0
    return round((curr - prev) / prev * 100, 1)


def _data_anchor(db: Session) -> datetime:
    """Anchor to the latest month that has invoice or expense data in the DB."""
    latest_inv = db.query(func.max(models.Invoice.issue_date)).scalar()
    latest_exp = db.query(func.max(models.Expense.date)).scalar()
    candidates = [d for d in [latest_inv, latest_exp] if d]
    if candidates:
        latest_str = max(candidates)
        try:
            return datetime.strptime(latest_str[:7], "%Y-%m")
        except ValueError:
            pass
    return datetime.utcnow()


def _real_monthly_revenue(db: Session, months_back: int = 12) -> list[dict]:
    """
    Real revenue/expense per month anchored to the latest month with data in the
    DB (not today).  Both invoice issue_date and expense date are 'YYYY-MM-DD'.
    """
    anchor = _data_anchor(db)
    rows = []
    for i in range(months_back - 1, -1, -1):
        ref = anchor.replace(day=1) - timedelta(days=i * 30)
        ym = ref.strftime("%Y-%m")
        label = ref.strftime("%b")

        rev = db.query(func.sum(models.Invoice.amount)).filter(
            models.Invoice.status == "paid",
            models.Invoice.issue_date.like(f"{ym}%"),
        ).scalar() or 0.0

        exp = db.query(func.sum(models.Expense.amount)).filter(
            models.Expense.date.like(f"{ym}%"),
        ).scalar() or 0.0

        rows.append({"month": label, "revenue": round(rev, 2), "expenses": round(exp, 2)})
    return rows


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    anchor = _data_anchor(db)
    curr_ym = anchor.strftime("%Y-%m")
    prev_ym = (anchor.replace(day=1) - timedelta(days=1)).strftime("%Y-%m")

    total_employees = db.query(models.Employee).count()
    active_projects = db.query(models.Project).filter(models.Project.status == "active").count()
    open_leads = db.query(models.Lead).filter(models.Lead.stage.notin_(["closed_won", "closed_lost"])).count()
    total_revenue = db.query(func.sum(models.Invoice.amount)).filter(models.Invoice.status == "paid").scalar() or 0
    total_expenses = db.query(func.sum(models.Expense.amount)).scalar() or 0
    pending_invoices = db.query(models.Invoice).filter(models.Invoice.status.in_(["draft", "sent"])).count()

    # Real employee growth: employees hired this month vs last month
    curr_new_emp = db.query(models.Employee).filter(
        models.Employee.joined_date.like(f"{curr_ym}%")
    ).count()
    prev_new_emp = db.query(models.Employee).filter(
        models.Employee.joined_date.like(f"{prev_ym}%")
    ).count()
    employee_growth = _pct_change(curr_new_emp, prev_new_emp)

    # Real revenue growth: paid invoices this month vs last month
    curr_rev = db.query(func.sum(models.Invoice.amount)).filter(
        models.Invoice.status == "paid",
        models.Invoice.issue_date.like(f"{curr_ym}%"),
    ).scalar() or 0.0
    prev_rev = db.query(func.sum(models.Invoice.amount)).filter(
        models.Invoice.status == "paid",
        models.Invoice.issue_date.like(f"{prev_ym}%"),
    ).scalar() or 0.0
    revenue_growth = _pct_change(curr_rev, prev_rev)

    return {
        "total_employees": total_employees,
        "total_revenue": round(total_revenue, 2),
        "active_projects": active_projects,
        "open_leads": open_leads,
        "total_expenses": round(total_expenses, 2),
        "pending_invoices": pending_invoices,
        "employee_growth": employee_growth,
        "revenue_growth": revenue_growth,
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
    # Real monthly revenue/expense data from invoices and expenses
    revenue_monthly = _real_monthly_revenue(db, months_back=12)

    # Real task counts by status
    tasks_by_status = [
        {"name": "To Do", "value": db.query(models.Task).filter(models.Task.status == "todo").count()},
        {"name": "In Progress", "value": db.query(models.Task).filter(models.Task.status == "in_progress").count()},
        {"name": "Done", "value": db.query(models.Task).filter(models.Task.status == "done").count()},
    ]

    # Real lead counts by stage
    leads_by_stage = [
        {"name": s.title().replace("_", " "), "value": db.query(models.Lead).filter(models.Lead.stage == s).count()}
        for s in ["prospecting", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"]
    ]

    # Real expense totals by category
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
