"""
Leave Request Workflow Service.

State machine:
  pending_department  →(dept head approves)→  pending_hr
  pending_department  →(dept head rejects)→   rejected
  pending_hr          →(hr approves)→          approved
  pending_hr          →(hr rejects)→           rejected

Legacy "pending" status is treated as "pending_department" for backward compat.
"""

from sqlalchemy.orm import Session
from fastapi import HTTPException
from app import models
from app.notifications.service import NotificationService
from datetime import datetime


# ── Workflow state machine definition ─────────────────────────────────────────

TRANSITIONS: dict[str, dict[str, str]] = {
    "pending_department": {
        "approve": "pending_hr",
        "reject": "rejected",
    },
    "pending_hr": {
        "approve": "approved",
        "reject": "rejected",
    },
    # Legacy status aliases
    "pending": {
        "approve": "pending_hr",
        "reject": "rejected",
    },
}

NEXT_APPROVER: dict[str, str | None] = {
    "pending_hr": "hr_manager",
    "approved": None,
    "rejected": None,
}

ACTION_LABELS: dict[tuple[str, str], str] = {
    ("pending_department", "approve"): "approved_stage1",
    ("pending", "approve"):            "approved_stage1",
    ("pending_hr", "approve"):         "approved_final",
    ("pending_department", "reject"):  "rejected",
    ("pending", "reject"):             "rejected",
    ("pending_hr", "reject"):          "rejected",
}


class LeaveWorkflowService:
    def __init__(self, db: Session):
        self.db = db
        self.notif = NotificationService(db)

    # ── Submit ─────────────────────────────────────────────────────────────────

    def submit(self, leave: models.LeaveRequest, actor: models.User) -> models.LeaveRequest:
        """Set initial workflow state on a newly created leave request."""
        leave.status = "pending_department"
        leave.current_approver_role = "department_head"
        leave.created_at = datetime.utcnow()
        leave.updated_at = datetime.utcnow()

        self._log(
            entity_id=leave.id,
            action="submitted",
            actor=actor,
            comments=None,
        )

        self.notif.create(
            title="New Leave Request Submitted",
            message=f"{actor.name} submitted a leave request awaiting department review.",
            notif_type="info",
            link="/hrms/leaves",
        )
        return leave

    # ── Approve / Reject ───────────────────────────────────────────────────────

    def action(
        self,
        leave_id: int,
        action: str,
        actor: models.User,
        comments: str | None = None,
    ) -> models.LeaveRequest:
        """Advance the workflow: approve or reject at the current stage."""
        leave = self.db.query(models.LeaveRequest).filter(
            models.LeaveRequest.id == leave_id
        ).first()
        if not leave:
            raise HTTPException(status_code=404, detail="Leave request not found")

        current = leave.status
        transitions = TRANSITIONS.get(current)
        if not transitions:
            raise HTTPException(
                status_code=400,
                detail=f"Leave request cannot be actioned (current status: '{current}')",
            )
        if action not in transitions:
            raise HTTPException(
                status_code=400,
                detail=f"Action '{action}' is not valid for status '{current}'",
            )

        new_status = transitions[action]
        leave.status = new_status
        leave.current_approver_role = NEXT_APPROVER.get(new_status)
        leave.updated_at = datetime.utcnow()

        log_action = ACTION_LABELS.get((current, action), action)
        self._log(entity_id=leave_id, action=log_action, actor=actor, comments=comments)

        emp = self.db.query(models.Employee).filter(
            models.Employee.id == leave.employee_id
        ).first()
        emp_name = emp.name if emp else "Employee"

        self._notify_action(new_status, emp_name, actor, comments)
        return leave

    # ── History ────────────────────────────────────────────────────────────────

    def get_logs(self, leave_id: int) -> list[models.WorkflowLog]:
        return (
            self.db.query(models.WorkflowLog)
            .filter(
                models.WorkflowLog.entity_type == "leave_request",
                models.WorkflowLog.entity_id == leave_id,
            )
            .order_by(models.WorkflowLog.timestamp)
            .all()
        )

    # ── Internals ──────────────────────────────────────────────────────────────

    def _log(
        self,
        entity_id: int,
        action: str,
        actor: models.User,
        comments: str | None,
    ) -> None:
        self.db.add(models.WorkflowLog(
            entity_type="leave_request",
            entity_id=entity_id,
            action=action,
            performed_by=actor.id,
            performed_by_name=actor.name,
            role=actor.role,
            comments=comments,
        ))

    def _notify_action(
        self,
        new_status: str,
        emp_name: str,
        actor: models.User,
        comments: str | None,
    ) -> None:
        suffix = f" Comment: {comments}" if comments else ""
        if new_status == "pending_hr":
            self.notif.create(
                title="Leave Forwarded to HR",
                message=f"{emp_name}'s leave request was approved by {actor.name} and forwarded to HR for final sign-off.{suffix}",
                notif_type="info",
                link="/hrms/leaves",
            )
        elif new_status == "approved":
            self.notif.create(
                title="Leave Request Approved",
                message=f"{emp_name}'s leave request has been fully approved by {actor.name}.{suffix}",
                notif_type="success",
                link="/hrms/leaves",
            )
        elif new_status == "rejected":
            self.notif.create(
                title="Leave Request Rejected",
                message=f"{emp_name}'s leave request was rejected by {actor.name}.{suffix}",
                notif_type="warning",
                link="/hrms/leaves",
            )
