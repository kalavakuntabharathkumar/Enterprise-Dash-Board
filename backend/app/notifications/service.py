"""
Centralized notification creation utilities.

Usage:
    svc = NotificationService(db)
    svc.create("Title", "Message", notif_type="info", user_id=5, link="/hrms/leaves")
    svc.create_for_role("Title", "Msg", role="admin", notif_type="warning")
    svc.create_global("Title", "System-wide message")
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
        target_role: str = None,
    ) -> models.Notification:
        """Create and stage a notification (caller must commit)."""
        n = models.Notification(
            title=title,
            message=message,
            type=notif_type,
            user_id=user_id,
            link=link,
            target_role=target_role,
            created_at=datetime.utcnow(),
        )
        self.db.add(n)
        return n

    def create_for_role(
        self,
        title: str,
        message: str,
        role: str,
        notif_type: str = "info",
        link: str = None,
    ) -> models.Notification:
        """Create a notification visible to all users of a given role."""
        return self.create(title, message, notif_type=notif_type, target_role=role, link=link)

    def create_global(
        self,
        title: str,
        message: str,
        notif_type: str = "info",
        link: str = None,
    ) -> models.Notification:
        """Create a global announcement visible to every user."""
        return self.create(title, message, notif_type=notif_type, link=link)
