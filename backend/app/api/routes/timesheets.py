from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from app.database import get_db
from app import models
from app.core.security import get_optional_user

router = APIRouter(prefix="/timesheets", tags=["timesheets"])


def ts_to_dict(t, db):
    emp = db.query(models.Employee).filter(models.Employee.id == t.employee_id).first()
    proj = db.query(models.Project).filter(models.Project.id == t.project_id).first() if t.project_id else None
    return {
        "id": t.id,
        "employee_id": t.employee_id,
        "employee_name": emp.name if emp else "Unknown",
        "project_id": t.project_id,
        "project_name": proj.name if proj else None,
        "date": t.date,
        "hours": t.hours,
        "description": t.description,
        "billable": t.billable,
        "status": t.status,
        "created_at": str(t.created_at),
    }


class TimesheetInput(BaseModel):
    employee_id: int
    project_id: Optional[int] = None
    date: str
    hours: float
    description: Optional[str] = None
    billable: bool = True


class TimesheetUpdate(BaseModel):
    hours: Optional[float] = None
    description: Optional[str] = None
    status: Optional[str] = None
    billable: Optional[bool] = None


@router.get("")
def list_timesheets(
    employee_id: Optional[int] = None,
    week: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_user),
):
    q = db.query(models.Timesheet)
    if current_user and current_user.role != "admin":
        emp = db.query(models.Employee).filter(models.Employee.email == current_user.email).first()
        if emp:
            q = q.filter(models.Timesheet.employee_id == emp.id)
        else:
            return []
    elif employee_id:
        q = q.filter(models.Timesheet.employee_id == employee_id)
    return [ts_to_dict(t, db) for t in q.order_by(models.Timesheet.date.desc()).all()]


@router.post("", status_code=201)
def create_timesheet(body: TimesheetInput, db: Session = Depends(get_db)):
    t = models.Timesheet(**body.model_dump())
    db.add(t)
    db.commit()
    db.refresh(t)
    return ts_to_dict(t, db)


@router.patch("/{id}")
def update_timesheet(id: int, body: TimesheetUpdate, db: Session = Depends(get_db)):
    t = db.query(models.Timesheet).filter(models.Timesheet.id == id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(t, k, v)
    db.commit()
    db.refresh(t)
    return ts_to_dict(t, db)


@router.delete("/{id}", status_code=204)
def delete_timesheet(id: int, db: Session = Depends(get_db)):
    t = db.query(models.Timesheet).filter(models.Timesheet.id == id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(t)
    db.commit()
