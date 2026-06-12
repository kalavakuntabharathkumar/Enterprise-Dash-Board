from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from app.database import get_db
from app import models
from app.core.security import get_optional_user

router = APIRouter(prefix="/support", tags=["support"])


def req_to_dict(r, db):
    emp = db.query(models.Employee).filter(models.Employee.id == r.employee_id).first()
    return {
        "id": r.id,
        "employee_id": r.employee_id,
        "employee_name": emp.name if emp else "Unknown",
        "request_type": r.request_type,
        "title": r.title,
        "description": r.description,
        "status": r.status,
        "priority": r.priority,
        "created_at": str(r.created_at),
        "updated_at": str(r.updated_at),
    }


class SupportInput(BaseModel):
    employee_id: int
    request_type: str
    title: str
    description: str
    priority: str = "medium"


class SupportStatusUpdate(BaseModel):
    status: str


@router.get("")
def list_requests(db: Session = Depends(get_db), current_user=Depends(get_optional_user)):
    q = db.query(models.SupportRequest)
    if current_user and current_user.role != "admin":
        emp = db.query(models.Employee).filter(models.Employee.email == current_user.email).first()
        if emp:
            q = q.filter(models.SupportRequest.employee_id == emp.id)
        else:
            return []
    return [req_to_dict(r, db) for r in q.order_by(models.SupportRequest.created_at.desc()).all()]


@router.post("", status_code=201)
def create_request(body: SupportInput, db: Session = Depends(get_db)):
    r = models.SupportRequest(**body.model_dump())
    db.add(r)
    db.commit()
    db.refresh(r)
    return req_to_dict(r, db)


@router.patch("/{id}/status")
def update_status(id: int, body: SupportStatusUpdate, db: Session = Depends(get_db)):
    r = db.query(models.SupportRequest).filter(models.SupportRequest.id == id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Not found")
    r.status = body.status
    r.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(r)
    return req_to_dict(r, db)


@router.delete("/{id}", status_code=204)
def delete_request(id: int, db: Session = Depends(get_db)):
    r = db.query(models.SupportRequest).filter(models.SupportRequest.id == id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(r)
    db.commit()
