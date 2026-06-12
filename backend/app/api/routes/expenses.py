from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from app.database import get_db
from app import models

router = APIRouter(prefix="/expenses", tags=["expenses"])


def exp_to_dict(e):
    return {"id": e.id, "title": e.title, "amount": e.amount, "category": e.category, "date": e.date, "status": e.status, "description": e.description, "submitted_by": e.submitted_by}


class ExpenseInput(BaseModel):
    title: str
    amount: float
    category: str
    date: str
    status: str = "pending"
    description: Optional[str] = None
    submitted_by: Optional[str] = None


class ExpenseUpdate(BaseModel):
    title: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None


@router.get("")
def list_expenses(category: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(models.Expense)
    if category:
        q = q.filter(models.Expense.category == category)
    return [exp_to_dict(e) for e in q.order_by(models.Expense.date.desc()).all()]


@router.post("", status_code=201)
def create_expense(body: ExpenseInput, db: Session = Depends(get_db)):
    e = models.Expense(**body.model_dump())
    db.add(e)
    db.commit()
    db.refresh(e)
    return exp_to_dict(e)


@router.patch("/{id}")
def update_expense(id: int, body: ExpenseUpdate, db: Session = Depends(get_db)):
    e = db.query(models.Expense).filter(models.Expense.id == id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(e, k, v)
    db.commit()
    db.refresh(e)
    return exp_to_dict(e)


@router.delete("/{id}", status_code=204)
def delete_expense(id: int, db: Session = Depends(get_db)):
    e = db.query(models.Expense).filter(models.Expense.id == id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(e)
    db.commit()
