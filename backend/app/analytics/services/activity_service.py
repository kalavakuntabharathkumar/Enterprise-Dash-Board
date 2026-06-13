"""Activity analytics service — system-wide activity frequency metrics."""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app import models
from app.core.scoping import get_effective_scope


def get_activity_analytics(user, db: Session) -> dict:
    scope = get_effective_scope(user, db)
    level = scope["level"]
    cutoff = datetime.utcnow() - timedelta(days=30)

    q = db.query(models.ActivityLog).filter(models.ActivityLog.timestamp >= cutoff)
    # Dept heads / employees only see activity they were involved in or from their dept
    if level not in ("admin", "hr_manager"):
        q = q.filter(models.ActivityLog.actor_id == user.id)

    all_activity = q.order_by(models.ActivityLog.timestamp.desc()).all()

    # Daily counts
    day_counts: dict[str, int] = {}
    for a in all_activity:
        d = a.timestamp.strftime("%Y-%m-%d")
        day_counts[d] = day_counts.get(d, 0) + 1

    # Fill all 30 days
    daily_activity = []
    now = datetime.utcnow()
    for i in range(29, -1, -1):
        d = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        label = (now - timedelta(days=i)).strftime("%b %d")
        daily_activity.append({"date": label, "count": day_counts.get(d, 0)})

    # Top actors
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
