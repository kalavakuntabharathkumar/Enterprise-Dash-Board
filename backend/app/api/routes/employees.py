from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from pydantic import BaseModel
from app.database import get_db
from app import models
from app.core.security import get_current_user
from app.core.rbac import require_permission
from app.core.scoping import scope_employee_query, get_effective_scope

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
    current_user=Depends(get_current_user),
):
    q = db.query(models.Employee)
    q = scope_employee_query(current_user, db, q)
    if department:
        q = q.filter(models.Employee.department == department)
    if status:
        q = q.filter(models.Employee.status == status)
    if search:
        q = q.filter(models.Employee.name.ilike(f"%{search}%"))
    return [emp_to_dict(e) for e in q.all()]


@router.get("/stats")
def get_employee_stats(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    scope = get_effective_scope(current_user, db)
    level = scope["level"]

    base_q = db.query(models.Employee)
    base_q = scope_employee_query(current_user, db, base_q)
    employees = base_q.all()

    total = len(employees)
    active = sum(1 for e in employees if e.status == "active")
    on_leave = sum(1 for e in employees if e.status == "on_leave")

    dept_counts: dict = {}
    for e in employees:
        dept_counts[e.department] = dept_counts.get(e.department, 0) + 1

    return {
        "total": total,
        "active": active,
        "on_leave": on_leave,
        "by_department": [{"name": d, "value": c} for d, c in dept_counts.items()],
        "scope_level": level,
    }


@router.get("/{id}")
def get_employee(id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    scope = get_effective_scope(current_user, db)
    level = scope["level"]

    e = db.query(models.Employee).filter(models.Employee.id == id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Non-admin/HR users can only fetch records they have dept/own access to
    if level in ("employee", "finance_manager"):
        if e.email != current_user.email:
            raise HTTPException(status_code=403, detail="Access denied: you may only view your own employee record.")
    elif level == "dept_head" and scope["dept"]:
        if e.department != scope["dept"]:
            raise HTTPException(status_code=403, detail=f"Access denied: employee is not in your department ({scope['dept']}).")

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
