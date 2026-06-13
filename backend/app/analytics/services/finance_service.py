"""Finance analytics service — real invoice/expense metrics from the DB."""
from sqlalchemy.orm import Session
from app import models


def get_finance_analytics(db: Session) -> dict:
    # ── Invoice status distribution ────────────────────────────────────────────
    invoices = db.query(models.Invoice).all()
    status_map: dict[str, dict] = {}
    for inv in invoices:
        s = inv.status
        if s not in status_map:
            status_map[s] = {"count": 0, "total": 0.0}
        status_map[s]["count"] += 1
        status_map[s]["total"] += inv.amount
    invoice_status_dist = [
        {"status": s, "count": v["count"], "total": round(v["total"], 2)}
        for s, v in status_map.items()
    ]

    total_paid = sum(inv.amount for inv in invoices if inv.status == "paid")
    total_outstanding = sum(inv.amount for inv in invoices if inv.status in ("sent", "overdue"))

    # ── Revenue by month (paid invoices, grouped by issue_date YYYY-MM) ───────
    revenue_months: dict[str, float] = {}
    for inv in invoices:
        if inv.status == "paid" and inv.issue_date:
            m = inv.issue_date[:7]  # "YYYY-MM"
            revenue_months[m] = revenue_months.get(m, 0.0) + inv.amount
    revenue_by_month = [
        {"month": k, "revenue": round(v, 2)}
        for k, v in sorted(revenue_months.items())
    ]

    # ── Expense by category ────────────────────────────────────────────────────
    expenses = db.query(models.Expense).all()
    cat_map: dict[str, float] = {}
    for e in expenses:
        cat_map[e.category] = cat_map.get(e.category, 0.0) + e.amount
    expense_by_category = [
        {"category": k, "total": round(v, 2)}
        for k, v in sorted(cat_map.items(), key=lambda x: -x[1])
    ]

    return {
        "total_paid": round(total_paid, 2),
        "total_outstanding": round(total_outstanding, 2),
        "revenue_by_month": revenue_by_month,
        "expense_by_category": expense_by_category,
        "invoice_status_distribution": invoice_status_dist,
    }


def get_finance_export_rows(db: Session) -> list[dict]:
    invoices = db.query(models.Invoice).all()
    return [
        {
            "invoice_number": inv.invoice_number,
            "client": inv.client,
            "amount": inv.amount,
            "status": inv.status,
            "issue_date": inv.issue_date,
            "due_date": inv.due_date,
            "description": inv.description or "",
        }
        for inv in invoices
    ]
