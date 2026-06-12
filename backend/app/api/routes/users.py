from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from app.database import get_db
from app import models

router = APIRouter(prefix="/users", tags=["users"])


def user_to_dict(u):
    return {"id": u.id, "name": u.name, "email": u.email, "role": u.role, "avatar": u.avatar, "created_at": str(u.created_at)}


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    avatar: Optional[str] = None
    role: Optional[str] = None


@router.get("")
def list_users(db: Session = Depends(get_db)):
    return [user_to_dict(u) for u in db.query(models.User).all()]


@router.patch("/{id}")
def update_user(id: int, body: UserUpdate, db: Session = Depends(get_db)):
    u = db.query(models.User).filter(models.User.id == id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(u, k, v)
    db.commit()
    db.refresh(u)
    return user_to_dict(u)
