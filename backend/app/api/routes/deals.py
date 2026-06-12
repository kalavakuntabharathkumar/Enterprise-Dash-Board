from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from app.database import get_db
from app import models

router = APIRouter(prefix="/deals", tags=["deals"])


def deal_to_dict(d):
    return {
        "id": d.id, "title": d.title, "contact": d.contact, "company": d.company,
        "value": d.value, "stage": d.stage, "probability": d.probability,
        "close_date": d.close_date, "assigned_to": d.assigned_to, "created_at": str(d.created_at),
    }


class DealInput(BaseModel):
    title: str
    contact: str
    close_date: str
    value: float
    stage: str = "prospecting"
    company: Optional[str] = None
    probability: Optional[float] = None
    assigned_to: Optional[str] = None


class DealUpdate(BaseModel):
    title: Optional[str] = None
    contact: Optional[str] = None
    company: Optional[str] = None
    value: Optional[float] = None
    stage: Optional[str] = None
    probability: Optional[float] = None
    close_date: Optional[str] = None
    assigned_to: Optional[str] = None


@router.get("")
def list_deals(stage: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(models.Deal)
    if stage:
        q = q.filter(models.Deal.stage == stage)
    return [deal_to_dict(d) for d in q.order_by(models.Deal.created_at.desc()).all()]


@router.post("", status_code=201)
def create_deal(body: DealInput, db: Session = Depends(get_db)):
    d = models.Deal(**body.model_dump())
    db.add(d)
    db.commit()
    db.refresh(d)
    return deal_to_dict(d)


@router.patch("/{id}")
def update_deal(id: int, body: DealUpdate, db: Session = Depends(get_db)):
    d = db.query(models.Deal).filter(models.Deal.id == id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(d, k, v)
    db.commit()
    db.refresh(d)
    return deal_to_dict(d)


@router.delete("/{id}", status_code=204)
def delete_deal(id: int, db: Session = Depends(get_db)):
    d = db.query(models.Deal).filter(models.Deal.id == id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(d)
    db.commit()
