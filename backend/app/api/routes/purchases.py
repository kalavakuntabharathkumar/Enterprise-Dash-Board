from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from app.database import get_db
from app import models

router = APIRouter(prefix="/purchases", tags=["purchases"])


def purchase_to_dict(p):
    return {"id": p.id, "vendor": p.vendor, "product": p.product, "quantity": p.quantity, "unit_price": p.unit_price, "total": p.total, "date": p.date, "status": p.status}


class PurchaseInput(BaseModel):
    vendor: str
    product: str
    quantity: int
    unit_price: float
    date: str
    status: str = "pending"


@router.get("")
def list_purchases(db: Session = Depends(get_db)):
    return [purchase_to_dict(p) for p in db.query(models.Purchase).order_by(models.Purchase.date.desc()).all()]


@router.post("", status_code=201)
def create_purchase(body: PurchaseInput, db: Session = Depends(get_db)):
    data = body.model_dump()
    data["total"] = data["quantity"] * data["unit_price"]
    p = models.Purchase(**data)
    db.add(p)
    db.commit()
    db.refresh(p)
    return purchase_to_dict(p)
