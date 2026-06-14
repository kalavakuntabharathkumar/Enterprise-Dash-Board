from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from app.database import get_db
from app import models

router = APIRouter(prefix="/workflows", tags=["workflows"])


# ── Analytics helpers ──────────────────────────────────────────────────────────

def compute_workflow_stats(db: Session, workflow_ids: Optional[List[int]] = None) -> dict:
    """Aggregate WorkflowRun data per workflow. Returns {workflow_id: stats_dict}."""
    query = db.query(models.WorkflowRun)
    if workflow_ids is not None:
        query = query.filter(models.WorkflowRun.workflow_id.in_(workflow_ids))

    stats: dict = {}
    for run in query.all():
        wid = run.workflow_id
        if wid not in stats:
            stats[wid] = {"total": 0, "successful": 0, "failed": 0, "durations": []}
        stats[wid]["total"] += 1
        if run.status == "completed":
            stats[wid]["successful"] += 1
        elif run.status == "failed":
            stats[wid]["failed"] += 1
        if run.duration_ms is not None:
            stats[wid]["durations"].append(run.duration_ms)

    for wid, s in stats.items():
        durations = s.pop("durations")
        s["avg_duration_ms"] = round(sum(durations) / len(durations)) if durations else None
        total = s["total"]
        s["success_rate"] = round(s["successful"] / total * 100, 1) if total > 0 else 0.0

    return stats


def step_to_dict(s: models.WorkflowStep) -> dict:
    return {
        "id": s.id,
        "workflow_id": s.workflow_id,
        "step_order": s.step_order,
        "action_type": s.action_type,
        "target": s.target,
        "delay_minutes": s.delay_minutes,
    }


def wf_to_dict(w: models.Workflow, stats: Optional[dict] = None) -> dict:
    s = stats or {}
    return {
        "id": w.id,
        "name": w.name,
        "description": w.description,
        "trigger": w.trigger,
        "status": w.status,
        "last_run": w.last_run,
        "created_at": str(w.created_at),
        "steps": [step_to_dict(step) for step in (w.steps or [])],
        # Computed from WorkflowRun records
        "total_runs": s.get("total", w.runs or 0),
        "successful_runs": s.get("successful", 0),
        "failed_runs": s.get("failed", 0),
        "avg_duration_ms": s.get("avg_duration_ms"),
        "success_rate": s.get("success_rate", 0.0),
        # Legacy field kept for backward compat
        "runs": s.get("total", w.runs or 0),
    }


# ── Pydantic models ────────────────────────────────────────────────────────────

class StepInput(BaseModel):
    step_order: int
    action_type: str
    target: str
    delay_minutes: int = 0


class WorkflowInput(BaseModel):
    name: str
    trigger: str
    description: Optional[str] = None
    status: str = "active"
    steps: List[StepInput] = []


class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    trigger: Optional[str] = None
    status: Optional[str] = None
    steps: Optional[List[StepInput]] = None


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.get("")
def list_workflows(db: Session = Depends(get_db)):
    workflows = db.query(models.Workflow).all()
    wf_ids = [w.id for w in workflows]
    stats_map = compute_workflow_stats(db, wf_ids)
    return [wf_to_dict(w, stats_map.get(w.id)) for w in workflows]


@router.get("/{id}")
def get_workflow(id: int, db: Session = Depends(get_db)):
    w = db.query(models.Workflow).filter(models.Workflow.id == id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Not found")
    stats_map = compute_workflow_stats(db, [w.id])
    return wf_to_dict(w, stats_map.get(w.id))


@router.post("", status_code=201)
def create_workflow(body: WorkflowInput, db: Session = Depends(get_db)):
    steps = body.steps
    wf_data = body.model_dump(exclude={"steps"})
    w = models.Workflow(**wf_data)
    db.add(w)
    db.flush()
    for step in steps:
        db.add(models.WorkflowStep(workflow_id=w.id, **step.model_dump()))
    db.commit()
    db.refresh(w)
    return wf_to_dict(w)


@router.patch("/{id}")
def update_workflow(id: int, body: WorkflowUpdate, db: Session = Depends(get_db)):
    w = db.query(models.Workflow).filter(models.Workflow.id == id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Not found")

    for k, v in body.model_dump(exclude_none=True, exclude={"steps"}).items():
        setattr(w, k, v)

    if body.steps is not None:
        db.query(models.WorkflowStep).filter(models.WorkflowStep.workflow_id == id).delete()
        for step in body.steps:
            db.add(models.WorkflowStep(workflow_id=w.id, **step.model_dump()))

    db.commit()
    db.refresh(w)
    stats_map = compute_workflow_stats(db, [w.id])
    return wf_to_dict(w, stats_map.get(w.id))


@router.delete("/{id}", status_code=204)
def delete_workflow(id: int, db: Session = Depends(get_db)):
    w = db.query(models.Workflow).filter(models.Workflow.id == id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(w)
    db.commit()


@router.post("/{id}/trigger")
def trigger_workflow(id: int, db: Session = Depends(get_db)):
    w = db.query(models.Workflow).filter(models.Workflow.id == id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Not found")

    now = datetime.utcnow()
    # Record the run as a proper WorkflowRun entry
    run = models.WorkflowRun(
        workflow_id=w.id,
        status="completed",
        started_at=now,
        completed_at=now,
        duration_ms=350,
    )
    db.add(run)

    w.runs = (w.runs or 0) + 1
    w.last_run = str(now)
    db.commit()

    notif = models.Notification(
        title="Workflow Triggered",
        message=f'Workflow "{w.name}" was triggered successfully.',
        type="success",
    )
    db.add(notif)
    db.commit()

    stats_map = compute_workflow_stats(db, [w.id])
    return {
        "workflow_id": id,
        "status": "success",
        "timestamp": str(now),
        "message": f'Workflow "{w.name}" triggered successfully',
        "stats": stats_map.get(w.id, {}),
    }


@router.get("/{id}/runs")
def list_workflow_runs(id: int, limit: int = 20, db: Session = Depends(get_db)):
    """Return recent runs for a specific workflow."""
    w = db.query(models.Workflow).filter(models.Workflow.id == id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Not found")

    runs = (
        db.query(models.WorkflowRun)
        .filter(models.WorkflowRun.workflow_id == id)
        .order_by(models.WorkflowRun.started_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": r.id,
            "status": r.status,
            "started_at": str(r.started_at),
            "completed_at": str(r.completed_at) if r.completed_at else None,
            "duration_ms": r.duration_ms,
            "error_message": r.error_message,
        }
        for r in runs
    ]
