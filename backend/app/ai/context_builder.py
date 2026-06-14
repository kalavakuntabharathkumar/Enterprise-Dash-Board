"""
AI Context Builder — gathers scoped real-time enterprise data for AI prompts.

Reuses all existing analytics services and scoping utilities.
Never fabricates data — returns only what the DB actually contains.
Errors in individual service calls are caught so a partial context is
always returned rather than crashing the whole AI request.
"""
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.core.scoping import get_effective_scope, scope_leave_query
from app import models


def build_context(user, db: Session, module: str = "general") -> dict:
    """
    Return a scoped context dict for the current user.

    The dict is injected into AI system prompts so every LLM call
    (and the fallback) answers with real operational data.

    Scope rules mirror the existing analytics services exactly:
      admin          — full org across all modules
      hr_manager     — HR, leave, activity, department, documents
      dept_head      — own-department HR + department + documents
      finance_manager — finance + documents
      employee       — own leaves + own notifications + scoped documents
    """
    scope = get_effective_scope(user, db)
    level = scope["level"]
    dept = scope.get("dept")

    ctx: dict = {
        "user_name": user.name,
        "user_role": level,
        "user_dept": dept,
        "module": module,
    }

    # ── HR analytics (admin, hr_manager, dept_head) ───────────────────────────
    if level in ("admin", "hr_manager", "dept_head"):
        try:
            from app.analytics.services.hr_service import get_hr_analytics
            ctx["hr"] = get_hr_analytics(user, db)
        except Exception:
            ctx["hr"] = None

    # ── Finance analytics (admin, finance_manager) ────────────────────────────
    if level in ("admin", "finance_manager"):
        try:
            from app.analytics.services.finance_service import get_finance_analytics
            ctx["finance"] = get_finance_analytics(db)
        except Exception:
            ctx["finance"] = None

    # ── Department analytics (admin, hr_manager, dept_head) ───────────────────
    if level in ("admin", "hr_manager", "dept_head"):
        try:
            from app.analytics.services.department_service import get_department_analytics
            ctx["department"] = get_department_analytics(user, db)
        except Exception:
            ctx["department"] = None

    # ── Activity analytics (admin, hr_manager) ────────────────────────────────
    if level in ("admin", "hr_manager"):
        try:
            from app.analytics.services.activity_service import get_activity_analytics
            ctx["activity"] = get_activity_analytics(user, db)
        except Exception:
            ctx["activity"] = None

    # ── Document analytics (all users, scoped server-side) ───────────────────
    try:
        from app.analytics.services.documents_service import get_document_analytics
        ctx["documents"] = get_document_analytics(user, db)
    except Exception:
        ctx["documents"] = None

    # ── Scoped leave summary (reuses scope_leave_query — no duplication) ──────
    try:
        leave_q = scope_leave_query(user, db, db.query(models.LeaveRequest))
        all_leaves = leave_q.all()
        pending_statuses = {"pending_department", "pending_hr", "pending"}
        ctx["leaves"] = {
            "total": len(all_leaves),
            "pending": sum(1 for lv in all_leaves if lv.status in pending_statuses),
            "approved": sum(1 for lv in all_leaves if lv.status == "approved"),
            "rejected": sum(1 for lv in all_leaves if lv.status == "rejected"),
        }
    except Exception:
        ctx["leaves"] = None

    # ── Notification summary (own user — not scoped to admin-only) ────────────
    try:
        notifs = db.query(models.Notification).filter(
            or_(
                models.Notification.user_id == user.id,
                models.Notification.target_role == user.role,
            )
        ).all()
        ctx["notifications"] = {
            "total": len(notifs),
            "unread": sum(1 for n in notifs if not n.read),
        }
    except Exception:
        ctx["notifications"] = None

    # ── Inventory / ERP (admin only — full picture) ───────────────────────────
    if level == "admin":
        try:
            products = db.query(models.Product).all()
            low_stock = [p for p in products if p.stock < 10]
            ctx["inventory"] = {
                "total_products": len(products),
                "low_stock_count": len(low_stock),
                "low_stock_items": [
                    {"name": p.name, "stock": p.stock} for p in low_stock[:5]
                ],
            }
        except Exception:
            ctx["inventory"] = None

        try:
            leads = db.query(models.Lead).all()
            open_leads = [l for l in leads if l.stage not in ("closed_won", "closed_lost")]
            won = [l for l in leads if l.stage == "closed_won"]
            ctx["crm"] = {
                "total_leads": len(leads),
                "open_leads": len(open_leads),
                "closed_won": len(won),
                "pipeline_value": round(sum(l.value or 0 for l in open_leads), 2),
                "conversion_rate": (
                    round(len(won) / len(leads) * 100, 1) if leads else 0.0
                ),
            }
        except Exception:
            ctx["crm"] = None

        try:
            projects = db.query(models.Project).all()
            active = [p for p in projects if p.status == "active"]
            ctx["projects"] = {
                "total": len(projects),
                "active": len(active),
                "avg_progress": (
                    round(sum(p.progress for p in active) / len(active), 1)
                    if active else 0.0
                ),
            }
        except Exception:
            ctx["projects"] = None

    return ctx
