from datetime import datetime
from sqlalchemy.orm import Session
from app import models
from app.workflows.step_runner import StepRunner


class WorkflowExecutor:
    """
    Lightweight prototype execution engine.
    Runs workflow steps sequentially, records per-step logs,
    and writes a final WorkflowRun record.
    """

    def __init__(self, db: Session):
        self.db = db
        self.step_runner = StepRunner(db)

    def execute(self, workflow: models.Workflow) -> models.WorkflowRun:
        now = datetime.utcnow()

        run = models.WorkflowRun(
            workflow_id=workflow.id,
            status="running",
            started_at=now,
        )
        self.db.add(run)
        self.db.flush()

        failed = False
        error_message: str | None = None

        for step in sorted(workflow.steps, key=lambda s: s.step_order):
            log = self.step_runner.execute_step(run.id, step)
            if log.status == "failed":
                failed = True
                error_message = log.message
                break  # halt on first failure (prototype behaviour)

        completed_at = datetime.utcnow()
        duration_ms = max(1, int((completed_at - now).total_seconds() * 1000))

        run.status = "failed" if failed else "completed"
        run.completed_at = completed_at
        run.duration_ms = duration_ms
        run.error_message = error_message

        workflow.runs = (workflow.runs or 0) + 1
        workflow.last_run = completed_at.isoformat()

        self.db.commit()
        self.db.refresh(run)
        return run
