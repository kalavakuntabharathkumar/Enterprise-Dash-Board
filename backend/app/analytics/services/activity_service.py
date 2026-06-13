"""Activity analytics service — system-wide activity frequency metrics.

Scope rules:
  admin / hr_manager  — org-wide activity feed
  dept_head           — activity from all users whose Employee record belongs to their dept
  finance_manager     — their own activity only (no cross-dept HR view)
  employee            — their own activity only
"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app import models
from app.core.scoping import get_effective_scope


def get_activity_analytics(user, db: Session) -> dict:
    scope = get_effective_scope(user, db)
    level = scope["level"]
    scope_dept = scope.get("dept")
    cutoff = datetime.utcnow() - timedelta(days=30)

    q = db.query(models.ActivityLog).filter(models.ActivityLog.timestamp >= cutoff)

    if level in ("admin", "hr_manager"):
        # Org-wide — no additional filter
        pass
    elif level == "dept_head" and scope_dept:
        # Scope to activity from users whose Employee email matches the dept
        all_emps = db.query(models.Employee).filter(
            models.Employee.department == scope_dept
        ).all()
        dept_emails = {e.email for e in all_emps}
        dept_user_ids = [
            u.id for u in db.query(models.User).all()
            if u.email in dept_emails
        ]
        if dept_user_ids:
            q = q.filter(models.ActivityLog.actor_id.in_(dept_user_ids))
        else:
            # No users in this dept — return empty
            q = q.filter(models.ActivityLog.actor_id == -1)
    else:
        # finance_manager / employee — own activity only
        q = q.filter(models.ActivityLog.actor_id == user.id)

    all_activity = q.order_by(models.ActivityLog.timestamp.desc()).all()

    # Daily counts (last 30 days)
    day_counts: dict[str, int] = {}
    for a in all_activity:
        d = a.timestamp.strftime("%Y-%m-%d")
        day_counts[d] = day_counts.get(d, 0) + 1

    daily_activity = []
    now = datetime.utcnow()
    for i in range(29, -1, -1):
        d = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        label = (now - timedelta(days=i)).strftime("%b %d")
        daily_activity.append({"date": label, "count": day_counts.get(d, 0)})

    # Top actors (only applicable for org-wide scopes)
    actor_counts: dict[str, int] = {}
    for a in all_activity:
        name = a.actor_name or "System"
        actor_counts[name] = actor_counts.get(name, 0) + 1
    top_actors = sorted(
        [{"name": k, "count": v} for k, v in actor_counts.items()],
        key=lambda x: -x["count"],
    )[:5]

    # Entity type breakdown
    entity_counts: dict[str, int] = {}
    for a in all_activity:
        et = a.entity_type or "general"
        entity_counts[et] = entity_counts.get(et, 0) + 1
    entity_type_breakdown = sorted(
        [{"entity_type": k, "count": v} for k, v in entity_counts.items()],
        key=lambda x: -x["count"],
    )

    return {
        "total_30d": len(all_activity),
        "daily_activity": daily_activity,
        "top_actors": top_actors,
        "entity_type_breakdown": entity_type_breakdown,
    }
