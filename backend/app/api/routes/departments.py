from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from app.database import get_db
from app import models

router = APIRouter(prefix="/departments", tags=["departments"])


def dept_to_dict(d, db):
    count = db.query(models.Employee).filter(models.Employee.department == d.name).count()
    return {"id": d.id, "name": d.name, "head": d.head, "employee_count": count, "description": d.description}


class DepartmentInput(BaseModel):
    name: str
    head: Optional[str] = None
    description: Optional[str] = None


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    head: Optional[str] = None
    description: Optional[str] = None


@router.get("")
def list_departments(db: Session = Depends(get_db)):
    return [dept_to_dict(d, db) for d in db.query(models.Department).all()]


@router.post("", status_code=201)
def create_department(body: DepartmentInput, db: Session = Depends(get_db)):
    d = models.Department(**body.model_dump())
    db.add(d)
    db.commit()
    db.refresh(d)
    return dept_to_dict(d, db)


@router.patch("/{id}")
def update_department(id: int, body: DepartmentUpdate, db: Session = Depends(get_db)):
    d = db.query(models.Department).filter(models.Department.id == id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(d, k, v)
    db.commit()
    db.refresh(d)
    return dept_to_dict(d, db)


@router.delete("/{id}", status_code=204)
def delete_department(id: int, db: Session = Depends(get_db)):
    d = db.query(models.Department).filter(models.Department.id == id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(d)
    db.commit()
