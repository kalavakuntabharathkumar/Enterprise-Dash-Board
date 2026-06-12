from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from app.database import get_db
from app import models
from app.core.security import get_optional_user

router = APIRouter(prefix="/documents", tags=["documents"])


def doc_to_dict(d, db):
    emp = db.query(models.Employee).filter(models.Employee.id == d.employee_id).first() if d.employee_id else None
    return {
        "id": d.id,
        "title": d.title,
        "doc_type": d.doc_type,
        "filename": d.filename,
        "size_kb": d.size_kb,
        "uploaded_by": d.uploaded_by,
        "employee_id": d.employee_id,
        "employee_name": emp.name if emp else None,
        "is_company_doc": d.is_company_doc,
        "created_at": str(d.created_at),
    }


class DocumentInput(BaseModel):
    title: str
    doc_type: str
    filename: str
    size_kb: int = 0
    employee_id: Optional[int] = None
    is_company_doc: bool = False


@router.get("")
def list_documents(db: Session = Depends(get_db), current_user=Depends(get_optional_user)):
    q = db.query(models.Document)
    if current_user and current_user.role != "admin":
        emp = db.query(models.Employee).filter(models.Employee.email == current_user.email).first()
        emp_id = emp.id if emp else -1
        q = q.filter(
            (models.Document.is_company_doc == True) |
            (models.Document.employee_id == emp_id)
        )
    return [doc_to_dict(d, db) for d in q.order_by(models.Document.created_at.desc()).all()]


@router.post("", status_code=201)
def create_document(body: DocumentInput, db: Session = Depends(get_db), current_user=Depends(get_optional_user)):
    d = models.Document(
        title=body.title,
        doc_type=body.doc_type,
        filename=body.filename,
        size_kb=body.size_kb,
        employee_id=body.employee_id,
        is_company_doc=body.is_company_doc,
        uploaded_by=current_user.name if current_user else "System",
    )
    db.add(d)
    db.commit()
    db.refresh(d)
    return doc_to_dict(d, db)


@router.delete("/{id}", status_code=204)
def delete_document(id: int, db: Session = Depends(get_db)):
    d = db.query(models.Document).filter(models.Document.id == id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(d)
    db.commit()
