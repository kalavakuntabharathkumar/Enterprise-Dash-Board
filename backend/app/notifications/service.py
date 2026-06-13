"""
Centralized notification creation utilities.

Usage:
    svc = NotificationService(db)
    svc.create("Title", "Message", notif_type="info", user_id=5, link="/hrms/leaves")
"""

from sqlalchemy.orm import Session
from app import models
from datetime import datetime


class NotificationService:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        title: str,
        message: str,
        notif_type: str = "info",
        user_id: int = None,
        link: str = None,
    ) -> models.Notification:
        """Create and stage a notification (caller must commit)."""
        n = models.Notification(
            title=title,
            message=message,
            type=notif_type,
            user_id=user_id,
            link=link,
            created_at=datetime.utcnow(),
        )
        self.db.add(n)
        return n
