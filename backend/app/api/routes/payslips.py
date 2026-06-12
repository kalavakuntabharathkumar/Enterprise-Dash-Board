from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from app.database import get_db
from app import models
from app.core.security import get_current_user, get_optional_user

router = APIRouter(prefix="/payslips", tags=["payslips"])


def payslip_to_dict(p, db):
    emp = db.query(models.Employee).filter(models.Employee.id == p.employee_id).first()
    return {
        "id": p.id,
        "employee_id": p.employee_id,
        "employee_name": emp.name if emp else "Unknown",
        "employee_email": emp.email if emp else None,
        "department": emp.department if emp else None,
        "month": p.month,
        "salary": p.salary,
        "deductions": p.deductions,
        "bonus": p.bonus,
        "final_amount": p.final_amount,
        "status": p.status,
        "generated_at": str(p.generated_at),
    }


class PayslipInput(BaseModel):
    employee_id: int
    month: str
    salary: float
    deductions: float = 0
    bonus: float = 0
    status: str = "paid"


@router.get("")
def list_payslips(db: Session = Depends(get_db), current_user=Depends(get_optional_user)):
    q = db.query(models.Payslip)
    if current_user and current_user.role != "admin":
        emp = db.query(models.Employee).filter(models.Employee.email == current_user.email).first()
        if emp:
            q = q.filter(models.Payslip.employee_id == emp.id)
        else:
            return []
    return [payslip_to_dict(p, db) for p in q.order_by(models.Payslip.month.desc()).all()]


@router.post("", status_code=201)
def create_payslip(body: PayslipInput, db: Session = Depends(get_db)):
    final = body.salary + body.bonus - body.deductions
    p = models.Payslip(
        employee_id=body.employee_id,
        month=body.month,
        salary=body.salary,
        deductions=body.deductions,
        bonus=body.bonus,
        final_amount=final,
        status=body.status,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return payslip_to_dict(p, db)


@router.get("/{id}")
def get_payslip(id: int, db: Session = Depends(get_db)):
    p = db.query(models.Payslip).filter(models.Payslip.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    return payslip_to_dict(p, db)
