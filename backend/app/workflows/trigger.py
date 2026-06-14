from sqlalchemy.orm import Session
from app import models
from app.workflows.executor import WorkflowExecutor


class TriggerDispatcher:
    """
    Entry-point for triggering workflows by ID.
    Resolves the workflow, delegates execution to WorkflowExecutor,
    and posts a notification with the outcome.
    """

    def __init__(self, db: Session):
        self.db = db

    def dispatch(self, workflow_id: int) -> dict:
        workflow = (
            self.db.query(models.Workflow)
            .filter(models.Workflow.id == workflow_id)
            .first()
        )
        if not workflow:
            return {"status": "error", "message": "Workflow not found"}

        executor = WorkflowExecutor(self.db)
        run = executor.execute(workflow)

        notif_type = "success" if run.status == "completed" else "error"
        notif_msg = (
            f'Workflow "{workflow.name}" completed successfully '
            f"in {run.duration_ms}ms."
            if run.status == "completed"
            else f'Workflow "{workflow.name}" failed: {run.error_message}'
        )
        self.db.add(
            models.Notification(
                title="Workflow Execution",
                message=notif_msg,
                type=notif_type,
            )
        )
        self.db.commit()

        return {
            "run_id": run.id,
            "workflow_id": workflow_id,
            "status": run.status,
            "duration_ms": run.duration_ms,
            "steps_executed": len(run.logs),
        }
