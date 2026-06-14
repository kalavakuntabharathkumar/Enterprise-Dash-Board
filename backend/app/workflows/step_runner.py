from datetime import datetime
from sqlalchemy.orm import Session
from app import models

# Map action types to human-readable outcome messages
ACTION_MESSAGES: dict[str, str] = {
    "send_notification": "Notification dispatched to {}",
    "send_email": "Email queued for {}",
    "create_task": "Task created and assigned to {}",
    "update_status": "Status updated to: {}",
    "approve_request": "Approval request sent to {}",
}

SUPPORTED_ACTIONS = set(ACTION_MESSAGES.keys())


class StepRunner:
    """Executes a single workflow step and records an execution log entry."""

    def __init__(self, db: Session):
        self.db = db

    def execute_step(self, run_id: int, step: models.WorkflowStep) -> models.WorkflowExecutionLog:
        action = step.action_type
        target = step.target or ""

        if action in SUPPORTED_ACTIONS:
            message = ACTION_MESSAGES[action].format(target)
            status = "success"
        else:
            message = f"Unknown action type: {action}"
            status = "failed"

        log = models.WorkflowExecutionLog(
            run_id=run_id,
            step_order=step.step_order,
            action_type=action,
            target=target,
            status=status,
            message=message,
            executed_at=datetime.utcnow(),
        )
        self.db.add(log)
        self.db.flush()
        return log
