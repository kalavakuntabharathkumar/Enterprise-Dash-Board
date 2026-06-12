from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app import models

router = APIRouter(prefix="/leaves", tags=["leaves"])


def leave_to_dict(l, db):
    emp = db.query(models.Employee).filter(models.Employee.id == l.employee_id).first()
    return {
        "id": l.id, "employee_id": l.employee_id,
        "employee_name": emp.name if emp else "Unknown",
        "type": l.type, "start_date": l.start_date, "end_date": l.end_date,
        "status": l.status, "reason": l.reason,
    }


class LeaveInput(BaseModel):
    employee_id: int
    type: str
    start_date: str
    end_date: str
    reason: str


class LeaveStatusUpdate(BaseModel):
    status: str


@router.get("")
def list_leaves(db: Session = Depends(get_db)):
    return [leave_to_dict(l, db) for l in db.query(models.LeaveRequest).all()]


@router.post("", status_code=201)
def create_leave(body: LeaveInput, db: Session = Depends(get_db)):
    l = models.LeaveRequest(**body.model_dump())
    db.add(l)
    db.commit()
    db.refresh(l)
    return leave_to_dict(l, db)


@router.patch("/{id}/status")
def update_leave_status(id: int, body: LeaveStatusUpdate, db: Session = Depends(get_db)):
    l = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == id).first()
    if not l:
        raise HTTPException(status_code=404, detail="Not found")
    l.status = body.status
    db.commit()
    db.refresh(l)
    return leave_to_dict(l, db)
