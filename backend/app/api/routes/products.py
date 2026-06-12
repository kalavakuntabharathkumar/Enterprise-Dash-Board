from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from pydantic import BaseModel
from app.database import get_db
from app import models

router = APIRouter(prefix="/products", tags=["products"])


def product_to_dict(p):
    return {
        "id": p.id, "name": p.name, "category": p.category, "sku": p.sku,
        "stock": p.stock, "unit_price": p.unit_price, "status": p.status,
        "description": p.description, "vendor": p.vendor,
    }


class ProductInput(BaseModel):
    name: str
    category: str
    sku: str
    stock: int
    unit_price: float
    status: str = "active"
    description: Optional[str] = None
    vendor: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    stock: Optional[int] = None
    unit_price: Optional[float] = None
    status: Optional[str] = None
    description: Optional[str] = None
    vendor: Optional[str] = None


@router.get("/stock-overview")
def get_stock_overview(db: Session = Depends(get_db)):
    total = db.query(models.Product).count()
    low_stock = db.query(models.Product).filter(models.Product.stock > 0, models.Product.stock <= 10).count()
    out_of_stock = db.query(models.Product).filter(models.Product.stock == 0).count()
    total_value = db.query(func.sum(models.Product.stock * models.Product.unit_price)).scalar() or 0
    return {"total_products": total, "low_stock": low_stock, "out_of_stock": out_of_stock, "total_value": round(total_value, 2)}


@router.get("")
def list_products(search: Optional[str] = None, category: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(models.Product)
    if search:
        q = q.filter(models.Product.name.ilike(f"%{search}%"))
    if category:
        q = q.filter(models.Product.category == category)
    return [product_to_dict(p) for p in q.all()]


@router.post("", status_code=201)
def create_product(body: ProductInput, db: Session = Depends(get_db)):
    p = models.Product(**body.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return product_to_dict(p)


@router.patch("/{id}")
def update_product(id: int, body: ProductUpdate, db: Session = Depends(get_db)):
    p = db.query(models.Product).filter(models.Product.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return product_to_dict(p)


@router.delete("/{id}", status_code=204)
def delete_product(id: int, db: Session = Depends(get_db)):
    p = db.query(models.Product).filter(models.Product.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(p)
    db.commit()
