from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from app.database import get_db
from app import models

router = APIRouter(prefix="/workflows", tags=["workflows"])


def wf_to_dict(w):
    return {"id": w.id, "name": w.name, "description": w.description, "trigger": w.trigger, "status": w.status, "runs": w.runs, "last_run": w.last_run, "created_at": str(w.created_at)}


class WorkflowInput(BaseModel):
    name: str
    trigger: str
    description: Optional[str] = None
    status: str = "active"


class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    trigger: Optional[str] = None
    status: Optional[str] = None


@router.get("")
def list_workflows(db: Session = Depends(get_db)):
    return [wf_to_dict(w) for w in db.query(models.Workflow).all()]


@router.post("", status_code=201)
def create_workflow(body: WorkflowInput, db: Session = Depends(get_db)):
    w = models.Workflow(**body.model_dump())
    db.add(w)
    db.commit()
    db.refresh(w)
    return wf_to_dict(w)


@router.patch("/{id}")
def update_workflow(id: int, body: WorkflowUpdate, db: Session = Depends(get_db)):
    w = db.query(models.Workflow).filter(models.Workflow.id == id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(w, k, v)
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
    notif = models.Notification(title="Workflow Triggered", message=f'Workflow "{w.name}" was triggered successfully.', type="success")
    db.add(notif)
    db.commit()
    return {"workflow_id": id, "status": "success", "timestamp": w.last_run, "message": f'Workflow "{w.name}" triggered successfully'}
