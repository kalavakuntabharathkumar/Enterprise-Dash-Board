from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from app.database import get_db
from app import models

router = APIRouter(prefix="/attendance", tags=["attendance"])


def att_to_dict(a, db):
    emp = db.query(models.Employee).filter(models.Employee.id == a.employee_id).first()
    return {
        "id": a.id, "employee_id": a.employee_id,
        "employee_name": emp.name if emp else "Unknown",
        "date": a.date, "check_in": a.check_in, "check_out": a.check_out, "status": a.status,
    }


class AttendanceInput(BaseModel):
    employee_id: int
    date: str
    status: str = "present"
    check_in: Optional[str] = None
    check_out: Optional[str] = None


@router.get("")
def list_attendance(employee_id: Optional[int] = None, date: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(models.AttendanceRecord)
    if employee_id:
        q = q.filter(models.AttendanceRecord.employee_id == employee_id)
    if date:
        q = q.filter(models.AttendanceRecord.date == date)
    return [att_to_dict(a, db) for a in q.order_by(models.AttendanceRecord.date.desc()).all()]


@router.post("", status_code=201)
def create_attendance(body: AttendanceInput, db: Session = Depends(get_db)):
    a = models.AttendanceRecord(**body.model_dump())
    db.add(a)
    db.commit()
    db.refresh(a)
    return att_to_dict(a, db)
