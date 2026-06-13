from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.database import get_db
from app import models
from app.core.security import get_optional_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


def notif_to_dict(n):
    return {
        "id": n.id,
        "title": n.title,
        "message": n.message,
        "type": n.type,
        "read": n.read,
        "created_at": str(n.created_at),
        "link": n.link,
        "user_id": getattr(n, "user_id", None),
        "target_role": getattr(n, "target_role", None),
    }


def _visible_filter(current_user):
    """Filter: global (no user/role) OR role-targeted OR user-targeted."""
    return or_(
        and_(
            models.Notification.user_id == None,
            models.Notification.target_role == None,
        ),
        models.Notification.target_role == current_user.role,
        models.Notification.user_id == current_user.id,
    )


@router.get("")
def list_notifications(
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_user),
):
    q = db.query(models.Notification).order_by(models.Notification.created_at.desc())
    if current_user:
        q = q.filter(_visible_filter(current_user))
    return [notif_to_dict(n) for n in q.limit(50).all()]


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_user),
):
    q = db.query(models.Notification).filter(models.Notification.read == False)
    if current_user:
        q = q.filter(_visible_filter(current_user))
    return {"count": q.count()}


@router.patch("/{id}/read")
def mark_notification_read(id: int, db: Session = Depends(get_db)):
    n = db.query(models.Notification).filter(models.Notification.id == id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Not found")
    n.read = True
    db.commit()
    db.refresh(n)
    return notif_to_dict(n)


@router.patch("/mark-all-read")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_user),
):
    q = db.query(models.Notification)
    if current_user:
        ids = [n.id for n in q.filter(_visible_filter(current_user)).all()]
        db.query(models.Notification).filter(
            models.Notification.id.in_(ids)
        ).update({"read": True}, synchronize_session=False)
    else:
        q.update({"read": True}, synchronize_session=False)
    db.commit()
    return {"message": "All notifications marked as read"}
