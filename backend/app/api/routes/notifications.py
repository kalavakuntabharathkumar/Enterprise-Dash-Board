from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models

router = APIRouter(prefix="/notifications", tags=["notifications"])


def notif_to_dict(n):
    return {"id": n.id, "title": n.title, "message": n.message, "type": n.type, "read": n.read, "created_at": str(n.created_at), "link": n.link}


@router.get("")
def list_notifications(db: Session = Depends(get_db)):
    return [notif_to_dict(n) for n in db.query(models.Notification).order_by(models.Notification.created_at.desc()).limit(50).all()]


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
def mark_all_notifications_read(db: Session = Depends(get_db)):
    db.query(models.Notification).update({"read": True})
    db.commit()
    return {"message": "All notifications marked as read"}
