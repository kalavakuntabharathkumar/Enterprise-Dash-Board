from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from app.database import get_db
from app import models

router = APIRouter(prefix="/contacts", tags=["contacts"])


def contact_to_dict(c):
    return {
        "id": c.id, "name": c.name, "email": c.email, "phone": c.phone,
        "company": c.company, "role": c.role, "avatar": c.avatar, "created_at": str(c.created_at),
    }


class ContactInput(BaseModel):
    name: str
    email: str
    company: str
    phone: Optional[str] = None
    role: Optional[str] = None


class ContactUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    role: Optional[str] = None


@router.get("")
def list_contacts(search: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(models.Contact)
    if search:
        q = q.filter(models.Contact.name.ilike(f"%{search}%") | models.Contact.company.ilike(f"%{search}%"))
    return [contact_to_dict(c) for c in q.all()]


@router.post("", status_code=201)
def create_contact(body: ContactInput, db: Session = Depends(get_db)):
    c = models.Contact(**body.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return contact_to_dict(c)


@router.patch("/{id}")
def update_contact(id: int, body: ContactUpdate, db: Session = Depends(get_db)):
    c = db.query(models.Contact).filter(models.Contact.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return contact_to_dict(c)


@router.delete("/{id}", status_code=204)
def delete_contact(id: int, db: Session = Depends(get_db)):
    c = db.query(models.Contact).filter(models.Contact.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(c)
    db.commit()
