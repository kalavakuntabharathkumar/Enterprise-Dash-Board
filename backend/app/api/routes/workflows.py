from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from app.database import get_db
from app import models

router = APIRouter(prefix="/workflows", tags=["workflows"])


def step_to_dict(s: models.WorkflowStep) -> dict:
    return {
        "id": s.id,
        "workflow_id": s.workflow_id,
        "step_order": s.step_order,
        "action_type": s.action_type,
        "target": s.target,
        "delay_minutes": s.delay_minutes,
    }


def wf_to_dict(w: models.Workflow) -> dict:
    return {
        "id": w.id,
        "name": w.name,
        "description": w.description,
        "trigger": w.trigger,
        "status": w.status,
        "runs": w.runs,
        "last_run": w.last_run,
        "created_at": str(w.created_at),
        "steps": [step_to_dict(s) for s in (w.steps or [])],
    }


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


@router.get("")
def list_workflows(db: Session = Depends(get_db)):
    workflows = db.query(models.Workflow).all()
    return [wf_to_dict(w) for w in workflows]


@router.get("/{id}")
def get_workflow(id: int, db: Session = Depends(get_db)):
    w = db.query(models.Workflow).filter(models.Workflow.id == id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Not found")
    return wf_to_dict(w)


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

    update_data = body.model_dump(exclude_none=True, exclude={"steps"})
    for k, v in update_data.items():
        setattr(w, k, v)

    if body.steps is not None:
        db.query(models.WorkflowStep).filter(models.WorkflowStep.workflow_id == id).delete()
        for step in body.steps:
            db.add(models.WorkflowStep(workflow_id=w.id, **step.model_dump()))

    db.commit()
    db.refresh(w)
    return wf_to_dict(w)


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
    w.runs = (w.runs or 0) + 1
    w.last_run = str(datetime.utcnow())
    db.commit()
    notif = models.Notification(
        title="Workflow Triggered",
        message=f'Workflow "{w.name}" was triggered successfully.',
        type="success",
    )
    db.add(notif)
    db.commit()
    return {
        "workflow_id": id,
        "status": "success",
        "timestamp": w.last_run,
        "message": f'Workflow "{w.name}" triggered successfully',
    }
