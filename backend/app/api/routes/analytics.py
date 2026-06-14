import io
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models
from app.core.security import get_current_user
from app.core.rbac import require_permission

router = APIRouter(prefix="/analytics", tags=["analytics"])


# ── Helpers ────────────────────────────────────────────────────────────────────

def _prev_month_str(ym: str) -> str:
    """Return the YYYY-MM string for the month before ym."""
    dt = datetime.strptime(ym, "%Y-%m")
    prev = (dt.replace(day=1) - timedelta(days=1))
    return prev.strftime("%Y-%m")


def _pct_change(curr: float, prev: float) -> float:
    """Safe percentage change; 0.0 when prev is 0."""
    if prev == 0:
        return 0.0
    return round((curr - prev) / prev * 100, 1)


def _data_anchor(db: Session) -> datetime:
    """
    Find the latest month that has invoice or expense data and use it as the
    anchor for monthly charts.  Falls back to utcnow() when the DB is empty.
    This ensures charts show real data even when the DB contains historical seed
    records that pre-date today.
    """
    latest_inv = db.query(func.max(models.Invoice.issue_date)).scalar()
    latest_exp = db.query(func.max(models.Expense.date)).scalar()
    candidates = [d for d in [latest_inv, latest_exp] if d]
    if candidates:
        latest_str = max(candidates)          # lexicographic max works on YYYY-MM-DD
        try:
            return datetime.strptime(latest_str[:7], "%Y-%m")
        except ValueError:
            pass
    return datetime.utcnow()


def _real_monthly_data(db: Session, months_back: int = 12) -> list[dict]:
    """
    Build a list of {month, revenue, expenses} dicts using real invoice/expense
    records.  Anchored to the latest month that has data in the DB so charts
    display real values even when using historical seed records.
    'month' is a short label e.g. 'Jan'.
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


# ── Existing endpoints (refactored to use real data) ──────────────────────────

@router.get("/overview")
def get_analytics_overview(
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("view_analytics")),
):
    # Anchor month-over-month comparisons to the latest month with real data
    anchor = _data_anchor(db)
    curr_ym = anchor.strftime("%Y-%m")
    prev_ym = _prev_month_str(curr_ym)

    # ── Real counts ────────────────────────────────────────────────────────────
    total_employees = db.query(models.Employee).count()
    total_revenue = db.query(func.sum(models.Invoice.amount)).filter(
        models.Invoice.status == "paid"
    ).scalar() or 0.0
    active_projects = db.query(models.Project).filter(models.Project.status == "active").count()

    total_leads = db.query(models.Lead).count()
    closed_won = db.query(models.Lead).filter(models.Lead.stage == "closed_won").count()
    conv_rate = round((closed_won / total_leads * 100) if total_leads > 0 else 0.0, 1)

    # ── Real month-over-month changes (anchored to latest data month) ──────────

    # Revenue: paid invoices in anchor month vs prior month
    curr_rev = db.query(func.sum(models.Invoice.amount)).filter(
        models.Invoice.status == "paid",
        models.Invoice.issue_date.like(f"{curr_ym}%"),
    ).scalar() or 0.0
    prev_rev = db.query(func.sum(models.Invoice.amount)).filter(
        models.Invoice.status == "paid",
        models.Invoice.issue_date.like(f"{prev_ym}%"),
    ).scalar() or 0.0
    revenue_change = _pct_change(curr_rev, prev_rev)

    # Employees: joined in anchor month vs prior month
    curr_emp = db.query(models.Employee).filter(
        models.Employee.joined_date.like(f"{curr_ym}%")
    ).count()
    prev_emp = db.query(models.Employee).filter(
        models.Employee.joined_date.like(f"{prev_ym}%")
    ).count()
    emp_change = _pct_change(curr_emp, prev_emp)

    # Active projects: started in anchor month vs prior month
    curr_proj = db.query(models.Project).filter(
        models.Project.start_date.like(f"{curr_ym}%")
    ).count()
    prev_proj = db.query(models.Project).filter(
        models.Project.start_date.like(f"{prev_ym}%")
    ).count()
    proj_change = _pct_change(curr_proj, prev_proj)

    # Lead conversion: compare anchor month to prior month using Lead.created_at
    curr_month_start = anchor.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    prev_month_start = (curr_month_start - timedelta(days=1)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    next_month_start = (curr_month_start.replace(day=28) + timedelta(days=4)).replace(day=1)

    curr_leads_total = db.query(models.Lead).filter(
        models.Lead.created_at >= curr_month_start,
        models.Lead.created_at < next_month_start,
    ).count()
    curr_leads_won = db.query(models.Lead).filter(
        models.Lead.created_at >= curr_month_start,
        models.Lead.created_at < next_month_start,
        models.Lead.stage == "closed_won",
    ).count()
    curr_conv = round((curr_leads_won / curr_leads_total * 100) if curr_leads_total > 0 else 0.0, 1)

    prev_leads_total = db.query(models.Lead).filter(
        models.Lead.created_at >= prev_month_start,
        models.Lead.created_at < curr_month_start,
    ).count()
    prev_leads_won = db.query(models.Lead).filter(
        models.Lead.created_at >= prev_month_start,
        models.Lead.created_at < curr_month_start,
        models.Lead.stage == "closed_won",
    ).count()
    prev_conv = round((prev_leads_won / prev_leads_total * 100) if prev_leads_total > 0 else 0.0, 1)
    conv_change = _pct_change(curr_conv, prev_conv)

    kpis = [
        {
            "label": "Total Revenue",
            "value": f"${total_revenue:,.0f}",
            "change": revenue_change,
            "trend": "up" if revenue_change >= 0 else "down",
        },
        {
            "label": "Total Employees",
            "value": str(total_employees),
            "change": emp_change,
            "trend": "up" if emp_change >= 0 else "down",
        },
        {
            "label": "Active Projects",
            "value": str(active_projects),
            "change": proj_change,
            "trend": "up" if proj_change >= 0 else "down",
        },
        {
            "label": "Lead Conversion",
            "value": f"{conv_rate}%",
            "change": conv_change,
            "trend": "up" if conv_change >= 0 else "down",
        },
    ]

    # ── Real 12-month revenue/expense performance ──────────────────────────────
    performance = _real_monthly_data(db, months_back=12)

    return {"kpis": kpis, "performance": performance}


@router.get("/department-stats")
def get_department_stats(
    db: Session = Depends(get_db),
    _=Depends(require_permission("view_analytics")),
):
    depts = db.query(models.Department).all()
    all_emps = db.query(models.Employee).all()
    all_projects = db.query(models.Project).all()
    all_attendance = db.query(models.AttendanceRecord).all()

    # Build lookup maps for efficiency
    emp_by_dept: dict[str, list] = {}
    for e in all_emps:
        emp_by_dept.setdefault(e.department, []).append(e)

    result = []
    for d in depts:
        dept_emps = emp_by_dept.get(d.name, [])
        emp_count = len(dept_emps)
        dept_emp_names = {e.name for e in dept_emps}
        dept_emp_ids = {e.id for e in dept_emps}

        # Performance: average project progress for projects managed by a dept employee
        dept_projects = [p for p in all_projects if p.manager in dept_emp_names]
        if dept_projects:
            avg_progress = round(sum(p.progress for p in dept_projects) / len(dept_projects), 1)
        else:
            avg_progress = 0.0

        # Budget used: attendance rate for dept employees (present+late / total records)
        dept_att = [a for a in all_attendance if a.employee_id in dept_emp_ids]
        if dept_att:
            present = sum(1 for a in dept_att if a.status in ("present", "late"))
            att_rate = round(present / len(dept_att) * 100, 1)
        else:
            att_rate = 0.0

        result.append({
            "department": d.name,
            "employees": emp_count,
            "performance": avg_progress,
            "budget_used": att_rate,
        })

    return result


# revenue-trend is also used by the Dashboard page (accessible to all authenticated users)
@router.get("/revenue-trend")
def get_revenue_trend(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return _real_monthly_data(db, months_back=12)


# ── Scoped analytics endpoints (already real — no changes) ────────────────────

@router.get("/hr")
def get_hr_analytics(
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("view_hr_analytics")),
):
    from app.analytics.services.hr_service import get_hr_analytics
    return get_hr_analytics(current_user, db)


@router.get("/finance")
def get_finance_analytics(
    db: Session = Depends(get_db),
    _=Depends(require_permission("view_finance_analytics")),
):
    from app.analytics.services.finance_service import get_finance_analytics
    return get_finance_analytics(db)


@router.get("/department")
def get_department_analytics(
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("manage_employees")),
):
    from app.analytics.services.department_service import get_department_analytics
    return get_department_analytics(current_user, db)


@router.get("/activity")
def get_activity_analytics(
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("view_analytics")),
):
    from app.analytics.services.activity_service import get_activity_analytics
    return get_activity_analytics(current_user, db)


@router.get("/documents")
def get_document_analytics(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from app.analytics.services.documents_service import get_document_analytics
    return get_document_analytics(current_user, db)


# ── Attendance analytics ───────────────────────────────────────────────────────

@router.get("/attendance/weekly")
def get_weekly_attendance(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """
    Return attendance counts grouped by day-of-week using real attendance_records.
    SQLite strftime('%w', date): 0 = Sunday, 1 = Monday … 6 = Saturday.
    """
    from sqlalchemy import text

    rows = db.execute(text(
        "SELECT strftime('%w', date) AS dow, status, COUNT(*) AS cnt "
        "FROM attendance_records "
        "GROUP BY dow, status"
    )).fetchall()

    DOW_NAME = {0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat"}
    DOW_ORDER = [1, 2, 3, 4, 5, 6, 0]  # Mon … Sun

    # Aggregate into {dow: {present, total}}
    agg: dict[int, dict] = {}
    for row in rows:
        dow = int(row[0])
        status = row[1]
        cnt = row[2]
        if dow not in agg:
            agg[dow] = {"present": 0, "total": 0}
        agg[dow]["total"] += cnt
        if status in ("present", "late"):
            agg[dow]["present"] += cnt

    weekly = []
    for dow in DOW_ORDER:
        d = agg.get(dow, {"present": 0, "total": 0})
        total = d["total"]
        present = d["present"]
        value = round(present / total * 100) if total > 0 else 0
        weekly.append({
            "label": DOW_NAME[dow],
            "value": value,
            "present": present,
            "total": total,
        })

    days_with_data = [d for d in weekly if d["total"] > 0]
    avg = round(sum(d["value"] for d in days_with_data) / len(days_with_data)) if days_with_data else 0

    return {"weekly": weekly, "avg_attendance": avg}


# ── CSV Export endpoints ───────────────────────────────────────────────────────

@router.get("/export/hr")
def export_hr_report(
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("view_hr_analytics")),
):
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
    current_user=Depends(require_permission("approve_leave")),
):
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
    current_user=Depends(require_permission("manage_employees")),
):
    from app.analytics.services.department_service import get_department_activity_export_rows
    from app.analytics.utils.csv_export import dicts_to_csv
    rows = get_department_activity_export_rows(current_user, db)
    csv_str = dicts_to_csv(rows, ["department", "employee_count", "leave_requests_30d", "activity_count_30d", "doc_uploads_30d"])
    return StreamingResponse(
        io.StringIO(csv_str),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=department-activity-report.csv"},
    )
