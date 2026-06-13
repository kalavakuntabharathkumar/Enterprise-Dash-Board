from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from pydantic import BaseModel
from app.database import get_db
from app import models
from app.core.security import get_current_user
from app.core.rbac import require_permission

router = APIRouter(prefix="/employees", tags=["employees"])


def emp_to_dict(e):
    return {
        "id": e.id, "name": e.name, "email": e.email, "phone": e.phone,
        "department": e.department, "position": e.position, "status": e.status,
        "salary": e.salary, "joined_date": e.joined_date, "avatar": e.avatar, "location": e.location,
    }


class EmployeeInput(BaseModel):
    name: str
    email: str
    department: str
    position: str
    status: str = "active"
    joined_date: str
    phone: Optional[str] = None
    salary: Optional[float] = None
    avatar: Optional[str] = None
    location: Optional[str] = None


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    status: Optional[str] = None
    salary: Optional[float] = None
    location: Optional[str] = None


# ── Read endpoints — require login only (used by both admin HRMS and employee Directory) ──

@router.get("")
def list_employees(
    department: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(models.Employee)
    if department:
        q = q.filter(models.Employee.department == department)
    if status:
        q = q.filter(models.Employee.status == status)
    if search:
        q = q.filter(models.Employee.name.ilike(f"%{search}%"))
    return [emp_to_dict(e) for e in q.all()]


@router.get("/stats")
def get_employee_stats(db: Session = Depends(get_db), _=Depends(get_current_user)):
    total = db.query(models.Employee).count()
    active = db.query(models.Employee).filter(models.Employee.status == "active").count()
    on_leave = db.query(models.Employee).filter(models.Employee.status == "on_leave").count()
    by_dept = db.query(models.Employee.department, func.count(models.Employee.id)).group_by(models.Employee.department).all()
    return {
        "total": total, "active": active, "on_leave": on_leave,
        "by_department": [{"name": d, "value": c} for d, c in by_dept],
    }


@router.get("/{id}")
def get_employee(id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    e = db.query(models.Employee).filter(models.Employee.id == id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp_to_dict(e)


# ── Write endpoints — require manage_employees permission ──

@router.post("", status_code=201)
def create_employee(
    body: EmployeeInput,
    db: Session = Depends(get_db),
    _=Depends(require_permission("manage_employees")),
):
    e = models.Employee(**body.model_dump())
    db.add(e)
    db.commit()
    db.refresh(e)
    return emp_to_dict(e)


@router.patch("/{id}")
def update_employee(
    id: int,
    body: EmployeeUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_permission("manage_employees")),
):
    e = db.query(models.Employee).filter(models.Employee.id == id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(e, k, v)
    db.commit()
    db.refresh(e)
    return emp_to_dict(e)


@router.delete("/{id}", status_code=204)
def delete_employee(
    id: int,
    db: Session = Depends(get_db),
    _=Depends(require_permission("manage_employees")),
):
    e = db.query(models.Employee).filter(models.Employee.id == id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(e)
    db.commit()
