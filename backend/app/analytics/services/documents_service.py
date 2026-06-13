"""Document analytics service — upload trends and distribution metrics."""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app import models
from app.core.scoping import get_effective_scope


def _scope_doc_query(user, db: Session, q):
    """Minimal document scoping for analytics."""
    scope = get_effective_scope(user, db)
    level = scope["level"]

    if level == "admin":
        return q
    if level == "hr_manager":
        from sqlalchemy import or_
        return q.filter(or_(
            models.Document.visibility.in_(["organization", "hr_only"]),
            models.Document.category == "HR",
        ))
    if level == "finance_manager":
        from sqlalchemy import or_
        return q.filter(or_(
            models.Document.visibility.in_(["organization", "finance_only"]),
            models.Document.category == "Finance",
        ))
    if level == "dept_head" and scope.get("dept"):
        from sqlalchemy import or_
        return q.filter(or_(
            models.Document.visibility == "organization",
            models.Document.department == scope["dept"],
            models.Document.uploaded_by_user_id == user.id,
        ))
    # Employee: organization-wide + own uploads
    from sqlalchemy import or_
    return q.filter(or_(
        models.Document.visibility == "organization",
        models.Document.uploaded_by_user_id == user.id,
    ))


def get_document_analytics(user, db: Session) -> dict:
    q = db.query(models.Document)
    q = _scope_doc_query(user, db, q)
    all_docs = q.all()

    # Uploads by month (last 6 months)
    cutoff = datetime.utcnow() - timedelta(days=182)
    recent = [d for d in all_docs if d.created_at and d.created_at >= cutoff]

    month_counts: dict[str, int] = {}
    for d in recent:
        m = d.created_at.strftime("%Y-%m")
        month_counts[m] = month_counts.get(m, 0) + 1

    uploads_by_month = []
    now = datetime.utcnow()
    for i in range(5, -1, -1):
        d = now.replace(day=1) - timedelta(days=i * 30)
        m = d.strftime("%Y-%m")
        label = d.strftime("%b %Y")
        uploads_by_month.append({"month": label, "count": month_counts.get(m, 0)})

    # Category distribution
    cat_counts: dict[str, int] = {}
    for d in all_docs:
        c = d.category or "General"
        cat_counts[c] = cat_counts.get(c, 0) + 1
    category_distribution = sorted(
        [{"category": k, "count": v} for k, v in cat_counts.items()],
        key=lambda x: -x["count"],
    )

    # Visibility breakdown
    vis_counts: dict[str, int] = {}
    for d in all_docs:
        v = d.visibility or "private"
        vis_counts[v] = vis_counts.get(v, 0) + 1
    visibility_breakdown = [{"visibility": k, "count": v} for k, v in vis_counts.items()]

    return {
        "total_docs": len(all_docs),
        "uploads_by_month": uploads_by_month,
        "category_distribution": category_distribution,
        "visibility_breakdown": visibility_breakdown,
    }
