from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.core.security import get_current_user

router = APIRouter(prefix="/activity", tags=["activity"])


def log_to_dict(l):
    return {
        "id": l.id,
        "actor_name": l.actor_name,
        "actor_role": l.actor_role,
        "action": l.action,
        "entity_type": l.entity_type,
        "entity_id": l.entity_id,
        "description": l.description,
        "timestamp": str(l.timestamp),
    }


@router.get("")
def list_activity(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Return recent activity entries.
    Admin: sees all entries (latest 50).
    Employee: sees only their own entries (latest 30).
    """
    q = db.query(models.ActivityLog).order_by(models.ActivityLog.timestamp.desc())
    if current_user.role == "admin":
        entries = q.limit(50).all()
    else:
        entries = q.filter(models.ActivityLog.actor_id == current_user.id).limit(30).all()
    return [log_to_dict(e) for e in entries]
