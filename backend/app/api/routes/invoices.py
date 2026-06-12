from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from pydantic import BaseModel
from app.database import get_db
from app import models
import random, string

router = APIRouter(prefix="/invoices", tags=["invoices"])


def inv_to_dict(i):
    return {"id": i.id, "invoice_number": i.invoice_number, "client": i.client, "amount": i.amount, "status": i.status, "issue_date": i.issue_date, "due_date": i.due_date, "description": i.description}


class InvoiceInput(BaseModel):
    client: str
    amount: float
    issue_date: str
    due_date: str
    status: str = "draft"
    description: Optional[str] = None


class InvoiceUpdate(BaseModel):
    client: Optional[str] = None
    amount: Optional[float] = None
    status: Optional[str] = None
    due_date: Optional[str] = None
    description: Optional[str] = None


@router.get("/finance-summary")
def get_finance_summary(db: Session = Depends(get_db)):
    total_revenue = db.query(func.sum(models.Invoice.amount)).filter(models.Invoice.status == "paid").scalar() or 0
    total_expenses = db.query(func.sum(models.Expense.amount)).scalar() or 0
    pending = db.query(func.sum(models.Invoice.amount)).filter(models.Invoice.status.in_(["draft", "sent"])).scalar() or 0
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    trend = [{"month": m, "revenue": round(80000 + i * 12000, 2), "expenses": round(50000 + i * 6000, 2)} for i, m in enumerate(months)]
    return {"total_revenue": round(total_revenue, 2), "total_expenses": round(total_expenses, 2), "net_profit": round(total_revenue - total_expenses, 2), "pending_amount": round(pending, 2), "revenue_trend": trend}


@router.get("")
def list_invoices(status: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(models.Invoice)
    if status:
        q = q.filter(models.Invoice.status == status)
    return [inv_to_dict(i) for i in q.order_by(models.Invoice.issue_date.desc()).all()]


@router.post("", status_code=201)
def create_invoice(body: InvoiceInput, db: Session = Depends(get_db)):
    num = "INV-" + "".join(random.choices(string.digits, k=6))
    i = models.Invoice(invoice_number=num, **body.model_dump())
    db.add(i)
    db.commit()
    db.refresh(i)
    return inv_to_dict(i)


@router.patch("/{id}")
def update_invoice(id: int, body: InvoiceUpdate, db: Session = Depends(get_db)):
    i = db.query(models.Invoice).filter(models.Invoice.id == id).first()
    if not i:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(i, k, v)
    db.commit()
    db.refresh(i)
    return inv_to_dict(i)


@router.delete("/{id}", status_code=204)
def delete_invoice(id: int, db: Session = Depends(get_db)):
    i = db.query(models.Invoice).filter(models.Invoice.id == id).first()
    if not i:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(i)
    db.commit()
