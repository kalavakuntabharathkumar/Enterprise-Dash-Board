"""
Enterprise Document Management System — scoped routes.

Visibility levels:
  private       — uploader + admin only
  department    — uploader's department + dept_heads + hr_manager + admin
  organization  — all authenticated users
  hr_only       — hr_manager + admin
  finance_only  — finance_manager + admin

Scope is resolved via the centralized get_effective_scope() from core/scoping.py.
Activity and notifications are logged via the shared service layer.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app import models
from app.core.security import get_current_user, get_optional_user
from app.core.scoping import get_effective_scope
from app.notifications.service import NotificationService
from app.notifications.activity_service import ActivityService

router = APIRouter(prefix="/documents", tags=["documents"])

# ─── Constants ────────────────────────────────────────────────────────────────

VALID_VISIBILITY = {"private", "department", "organization", "hr_only", "finance_only"}
VALID_CATEGORIES = {"General", "HR", "Finance", "Engineering", "Operations", "Legal", "Sales", "Marketing", "IT"}
VALID_ACCESS = {"view", "edit"}


# ─── Scoping helper ───────────────────────────────────────────────────────────

def _scope_document_query(user, db: Session, query):
    """Filter a Document query to only rows the user may see."""
    scope = get_effective_scope(user, db)
    level = scope["level"]

    if level == "admin":
        return query  # full org access

    # Resolve user's department via Employee record
    emp = db.query(models.Employee).filter(models.Employee.email == user.email).first()
    user_dept = emp.department if emp else scope.get("dept")

    # Documents explicitly shared with this user
    shared_ids = [
        a.document_id for a in
        db.query(models.DocumentAccess)
        .filter(models.DocumentAccess.user_id == user.id)
        .all()
    ]

    conditions = [
        # Own uploads (matched by user_id OR by name for legacy rows)
        models.Document.uploaded_by_user_id == user.id,
        models.Document.uploaded_by == user.name,
        # Organization-wide (or legacy is_company_doc): visible to all
        models.Document.visibility == "organization",
        models.Document.is_company_doc == True,
    ]

    if shared_ids:
        conditions.append(models.Document.id.in_(shared_ids))

    if level == "hr_manager":
        conditions.append(models.Document.visibility == "hr_only")
        conditions.append(models.Document.category == "HR")

    elif level == "finance_manager":
        conditions.append(models.Document.visibility == "finance_only")
        conditions.append(models.Document.category == "Finance")

    elif level in ("dept_head", "employee") and user_dept:
        # Department-visible docs from their own department
        conditions.append(
            and_(
                models.Document.visibility == "department",
                models.Document.department == user_dept,
            )
        )

    return query.filter(or_(*conditions))


def _can_delete(user, doc, db: Session) -> bool:
    scope = get_effective_scope(user, db)
    if scope["level"] == "admin":
        return True
    return doc.uploaded_by_user_id == user.id


def _doc_to_dict(d: models.Document, db: Session) -> dict:
    emp = (
        db.query(models.Employee).filter(models.Employee.id == d.employee_id).first()
        if d.employee_id else None
    )
    return {
        "id": d.id,
        "title": d.title,
        "doc_type": d.doc_type,
        "filename": d.filename,
        "size_kb": d.size_kb,
        "uploaded_by": d.uploaded_by,
        "uploaded_by_user_id": d.uploaded_by_user_id,
        "employee_id": d.employee_id,
        "employee_name": emp.name if emp else None,
        "is_company_doc": d.is_company_doc,
        "category": d.category or "General",
        "visibility": d.visibility or "private",
        "description": d.description,
        "department": d.department,
        "created_at": str(d.created_at) if d.created_at else None,
    }


# ─── Schemas ──────────────────────────────────────────────────────────────────

class DocumentCreate(BaseModel):
    title: str
    doc_type: str
    filename: str
    size_kb: int = 0
    description: Optional[str] = None
    category: str = "General"
    visibility: str = "private"
    department: Optional[str] = None
    employee_id: Optional[int] = None
    is_company_doc: bool = False


class ShareRequest(BaseModel):
    user_id: int
    access_type: str = "view"


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.get("")
def list_documents(
    category: Optional[str] = Query(None),
    visibility: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List documents scoped to the current user's access level."""
    q = _scope_document_query(current_user, db, db.query(models.Document))

    if category:
        q = q.filter(models.Document.category == category)
    if visibility:
        q = q.filter(models.Document.visibility == visibility)
    if search:
        q = q.filter(models.Document.title.ilike(f"%{search}%"))

    docs = q.order_by(models.Document.created_at.desc()).all()
    return [_doc_to_dict(d, db) for d in docs]


@router.post("", status_code=201)
def create_document(
    body: DocumentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Upload a document (metadata). Visibility and department determine access scope."""
    if body.visibility not in VALID_VISIBILITY:
        raise HTTPException(status_code=400, detail=f"Invalid visibility. Choose from: {', '.join(VALID_VISIBILITY)}")
    if body.category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category. Choose from: {', '.join(VALID_CATEGORIES)}")

    # Resolve uploader's department if not provided
    dept = body.department
    if not dept and body.visibility == "department":
        emp = db.query(models.Employee).filter(models.Employee.email == current_user.email).first()
        dept = emp.department if emp else None

    doc = models.Document(
        title=body.title,
        doc_type=body.doc_type,
        filename=body.filename,
        size_kb=body.size_kb,
        description=body.description,
        category=body.category,
        visibility=body.visibility,
        department=dept,
        employee_id=body.employee_id,
        is_company_doc=body.is_company_doc,
        uploaded_by=current_user.name,
        uploaded_by_user_id=current_user.id,
        created_at=datetime.utcnow(),
    )
    db.add(doc)
    db.flush()

    # Activity log
    ActivityService(db).log(
        action="document_uploaded",
        description=f"{current_user.name} uploaded '{body.title}'",
        actor_id=current_user.id,
        actor_name=current_user.name,
        actor_role=current_user.role,
        entity_type="document",
        entity_id=doc.id,
    )

    # Notify admins of org-wide docs
    if body.visibility == "organization":
        NotificationService(db).create_for_role(
            title="New Document Available",
            message=f"{current_user.name} shared '{body.title}' with the organization",
            role="admin",
            notif_type="info",
            link="/documents",
        )

    db.commit()
    db.refresh(doc)
    return _doc_to_dict(doc, db)


@router.get("/{doc_id}")
def get_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Fetch a single document — enforces scope."""
    q = _scope_document_query(current_user, db, db.query(models.Document))
    doc = q.filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or access denied")
    return _doc_to_dict(doc, db)


@router.delete("/{doc_id}", status_code=204)
def delete_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Delete a document. Only uploader or admin may delete."""
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if not _can_delete(current_user, doc, db):
        raise HTTPException(status_code=403, detail="You may only delete documents you uploaded")

    ActivityService(db).log(
        action="document_deleted",
        description=f"{current_user.name} deleted '{doc.title}'",
        actor_id=current_user.id,
        actor_name=current_user.name,
        actor_role=current_user.role,
        entity_type="document",
        entity_id=doc.id,
    )

    # Remove access grants first
    db.query(models.DocumentAccess).filter(models.DocumentAccess.document_id == doc_id).delete()
    db.delete(doc)
    db.commit()


@router.post("/{doc_id}/share", status_code=201)
def share_document(
    doc_id: int,
    body: ShareRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Grant explicit access to a specific user. Uploader or admin only."""
    doc = db.query(models.Document).filter(models.Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Only uploader or admin may share
    scope = get_effective_scope(current_user, db)
    if scope["level"] != "admin" and doc.uploaded_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the document owner or admin may share this document")

    if body.access_type not in VALID_ACCESS:
        raise HTTPException(status_code=400, detail="access_type must be 'view' or 'edit'")

    # Idempotent: update if exists
    existing = (
        db.query(models.DocumentAccess)
        .filter(
            models.DocumentAccess.document_id == doc_id,
            models.DocumentAccess.user_id == body.user_id,
        )
        .first()
    )
    if existing:
        existing.access_type = body.access_type
    else:
        db.add(models.DocumentAccess(
            document_id=doc_id,
            user_id=body.user_id,
            access_type=body.access_type,
            granted_by=current_user.id,
        ))

    # Notify the target user
    target_user = db.query(models.User).filter(models.User.id == body.user_id).first()
    if target_user:
        NotificationService(db).create(
            title="Document Shared With You",
            message=f"{current_user.name} shared '{doc.title}' with you",
            notif_type="info",
            user_id=target_user.id,
            link="/documents",
        )

    ActivityService(db).log(
        action="document_shared",
        description=f"{current_user.name} shared '{doc.title}' with user #{body.user_id}",
        actor_id=current_user.id,
        actor_name=current_user.name,
        actor_role=current_user.role,
        entity_type="document",
        entity_id=doc_id,
    )

    db.commit()
    return {"status": "shared", "document_id": doc_id, "user_id": body.user_id}


@router.get("/meta/categories")
def list_categories():
    """Return valid document categories."""
    return sorted(VALID_CATEGORIES)
