from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from app.database import get_db
from app import models
from app.core.security import get_optional_user

router = APIRouter(prefix="/announcements", tags=["announcements"])


def ann_to_dict(a):
    return {
        "id": a.id,
        "title": a.title,
        "content": a.content,
        "type": a.type,
        "pinned": a.pinned,
        "created_by": a.created_by,
        "created_at": str(a.created_at),
    }


class AnnouncementInput(BaseModel):
    title: str
    content: str
    type: str = "general"
    pinned: bool = False


class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    type: Optional[str] = None
    pinned: Optional[bool] = None


@router.get("")
def list_announcements(db: Session = Depends(get_db)):
    items = db.query(models.Announcement).order_by(
        models.Announcement.pinned.desc(),
        models.Announcement.created_at.desc()
    ).all()
    return [ann_to_dict(a) for a in items]


@router.post("", status_code=201)
def create_announcement(body: AnnouncementInput, db: Session = Depends(get_db), current_user=Depends(get_optional_user)):
    a = models.Announcement(
        title=body.title,
        content=body.content,
        type=body.type,
        pinned=body.pinned,
        created_by=current_user.name if current_user else "Admin",
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return ann_to_dict(a)


@router.patch("/{id}")
def update_announcement(id: int, body: AnnouncementUpdate, db: Session = Depends(get_db)):
    a = db.query(models.Announcement).filter(models.Announcement.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(a, k, v)
    db.commit()
    db.refresh(a)
    return ann_to_dict(a)


@router.delete("/{id}", status_code=204)
def delete_announcement(id: int, db: Session = Depends(get_db)):
    a = db.query(models.Announcement).filter(models.Announcement.id == id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(a)
    db.commit()
