from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from app.database import get_db
from app import models

router = APIRouter(prefix="/leads", tags=["leads"])

STAGES = ["prospecting", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"]


def lead_to_dict(l):
    return {
        "id": l.id, "name": l.name, "company": l.company, "email": l.email,
        "phone": l.phone, "status": l.status, "stage": l.stage, "value": l.value,
        "assigned_to": l.assigned_to, "created_at": str(l.created_at),
    }


class LeadInput(BaseModel):
    name: str
    company: str
    email: str
    stage: str
    value: float
    phone: Optional[str] = None
    status: str = "new"
    assigned_to: Optional[str] = None


class LeadUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    stage: Optional[str] = None
    value: Optional[float] = None
    assigned_to: Optional[str] = None


@router.get("/pipeline")
def get_lead_pipeline(db: Session = Depends(get_db)):
    result = []
    for stage in STAGES:
        count = db.query(models.Lead).filter(models.Lead.stage == stage).count()
        value = db.query(func.sum(models.Lead.value)).filter(models.Lead.stage == stage).scalar() or 0
        result.append({"stage": stage, "count": count, "value": round(value, 2)})
    return result


@router.get("")
def list_leads(status: Optional[str] = None, search: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(models.Lead)
    if status:
        q = q.filter(models.Lead.status == status)
    if search:
        q = q.filter(models.Lead.name.ilike(f"%{search}%") | models.Lead.company.ilike(f"%{search}%"))
    return [lead_to_dict(l) for l in q.order_by(models.Lead.created_at.desc()).all()]


@router.post("", status_code=201)
def create_lead(body: LeadInput, db: Session = Depends(get_db)):
    l = models.Lead(**body.model_dump())
    db.add(l)
    db.commit()
    db.refresh(l)
    return lead_to_dict(l)


@router.get("/{id}")
def get_lead(id: int, db: Session = Depends(get_db)):
    l = db.query(models.Lead).filter(models.Lead.id == id).first()
    if not l:
        raise HTTPException(status_code=404, detail="Not found")
    return lead_to_dict(l)


@router.patch("/{id}")
def update_lead(id: int, body: LeadUpdate, db: Session = Depends(get_db)):
    l = db.query(models.Lead).filter(models.Lead.id == id).first()
    if not l:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(l, k, v)
    db.commit()
    db.refresh(l)
    return lead_to_dict(l)


@router.delete("/{id}", status_code=204)
def delete_lead(id: int, db: Session = Depends(get_db)):
    l = db.query(models.Lead).filter(models.Lead.id == id).first()
    if not l:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(l)
    db.commit()
