from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from app.database import get_db
from app import models
from app.core.security import get_current_user
from app.core.rbac import require_permission
from app.core.scoping import scope_leave_query, validate_leave_approval_scope
from app.workflows.service import LeaveWorkflowService

router = APIRouter(prefix="/leaves", tags=["leaves"])


# ── Serializers ────────────────────────────────────────────────────────────────

def leave_to_dict(l, db):
    emp = db.query(models.Employee).filter(models.Employee.id == l.employee_id).first()
    return {
        "id": l.id,
        "employee_id": l.employee_id,
        "employee_name": emp.name if emp else "Unknown",
        "type": l.type,
        "start_date": l.start_date,
        "end_date": l.end_date,
        "status": l.status,
        "reason": l.reason,
        "current_approver_role": getattr(l, "current_approver_role", None),
        "created_at": str(l.created_at) if getattr(l, "created_at", None) else None,
        "updated_at": str(l.updated_at) if getattr(l, "updated_at", None) else None,
    }


def log_to_dict(log):
    return {
        "id": log.id,
        "action": log.action,
        "performed_by_name": log.performed_by_name,
        "role": log.role,
        "comments": log.comments,
        "timestamp": str(log.timestamp),
    }


# ── Schemas ────────────────────────────────────────────────────────────────────

class LeaveInput(BaseModel):
    employee_id: int
    type: str
    start_date: str
    end_date: str
    reason: str


class LeaveStatusUpdate(BaseModel):
    status: str


class LeaveActionInput(BaseModel):
    action: str           # "approve" | "reject"
    comments: Optional[str] = None


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.get("")
def list_leaves(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """List leave requests scoped to the current user's department visibility."""
    q = db.query(models.LeaveRequest).order_by(models.LeaveRequest.id.desc())
    q = scope_leave_query(current_user, db, q)
    return [leave_to_dict(l, db) for l in q.all()]


@router.post("", status_code=201)
def create_leave(
    body: LeaveInput,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Submit a leave request — starts the workflow at pending_department."""
    l = models.LeaveRequest(**body.model_dump())
    db.add(l)
    db.flush()  # assign PK before service uses it

    svc = LeaveWorkflowService(db)
    svc.submit(l, current_user)

    db.commit()
    db.refresh(l)
    return leave_to_dict(l, db)


@router.patch("/{id}/status")
def update_leave_status(
    id: int,
    body: LeaveStatusUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Legacy direct status update — preserved for backward compatibility with existing frontend hooks."""
    l = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == id).first()
    if not l:
        raise HTTPException(status_code=404, detail="Not found")
    l.status = body.status
    if hasattr(l, "updated_at"):
        from datetime import datetime
        l.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(l)
    return leave_to_dict(l, db)


@router.post("/{id}/action")
def perform_leave_action(
    id: int,
    body: LeaveActionInput,
    db: Session = Depends(get_db),
    current_user=Depends(require_permission("approve_leave")),
):
    """Workflow action: advance leave through approval stages.

    Requires: approve_leave permission (HR Manager, Department Head, Admin).
    Department Heads may only act on leaves for employees in their own department.
    Body: { action: "approve" | "reject", comments?: string }
    """
    if body.action not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="action must be 'approve' or 'reject'")

    leave = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    validate_leave_approval_scope(current_user, leave, db)

    svc = LeaveWorkflowService(db)
    leave = svc.action(id, body.action, current_user, body.comments)
    db.commit()
    db.refresh(leave)
    return leave_to_dict(leave, db)


@router.get("/{id}/logs")
def get_leave_logs(
    id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Fetch the complete workflow audit trail for a leave request."""
    l = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == id).first()
    if not l:
        raise HTTPException(status_code=404, detail="Not found")
    svc = LeaveWorkflowService(db)
    return [log_to_dict(log) for log in svc.get_logs(id)]
