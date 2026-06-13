"""
Centralized activity log creation utilities.

Usage:
    svc = ActivityService(db)
    svc.log("leave_submitted", "Jordan Lee submitted a leave request",
            actor_id=3, actor_name="Jordan Lee", actor_role="employee",
            entity_type="leave_request", entity_id=7)
"""

from sqlalchemy.orm import Session
from app import models
from datetime import datetime


class ActivityService:
    def __init__(self, db: Session):
        self.db = db

    def log(
        self,
        action: str,
        description: str,
        actor_id: int = None,
        actor_name: str = None,
        actor_role: str = None,
        entity_type: str = None,
        entity_id: int = None,
    ) -> models.ActivityLog:
        """Create and stage an activity log entry (caller must commit)."""
        entry = models.ActivityLog(
            actor_id=actor_id,
            actor_name=actor_name,
            actor_role=actor_role,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
            timestamp=datetime.utcnow(),
        )
        self.db.add(entry)
        return entry
