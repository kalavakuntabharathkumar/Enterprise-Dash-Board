from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from app.database import get_db
from app import models

router = APIRouter(prefix="/vendors", tags=["vendors"])


def vendor_to_dict(v):
    return {"id": v.id, "name": v.name, "email": v.email, "phone": v.phone, "address": v.address, "status": v.status, "category": v.category}


class VendorInput(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    status: str = "active"
    category: Optional[str] = None


class VendorUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    status: Optional[str] = None
    category: Optional[str] = None


@router.get("")
def list_vendors(db: Session = Depends(get_db)):
    return [vendor_to_dict(v) for v in db.query(models.Vendor).all()]


@router.post("", status_code=201)
def create_vendor(body: VendorInput, db: Session = Depends(get_db)):
    v = models.Vendor(**body.model_dump())
    db.add(v)
    db.commit()
    db.refresh(v)
    return vendor_to_dict(v)


@router.patch("/{id}")
def update_vendor(id: int, body: VendorUpdate, db: Session = Depends(get_db)):
    v = db.query(models.Vendor).filter(models.Vendor.id == id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v2 in body.model_dump(exclude_none=True).items():
        setattr(v, k, v2)
    db.commit()
    db.refresh(v)
    return vendor_to_dict(v)


@router.delete("/{id}", status_code=204)
def delete_vendor(id: int, db: Session = Depends(get_db)):
    v = db.query(models.Vendor).filter(models.Vendor.id == id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(v)
    db.commit()
