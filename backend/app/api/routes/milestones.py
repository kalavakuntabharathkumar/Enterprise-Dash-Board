from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from app.database import get_db
from app import models

router = APIRouter(prefix="/milestones", tags=["milestones"])


def ms_to_dict(m, db):
    proj = db.query(models.Project).filter(models.Project.id == m.project_id).first()
    return {"id": m.id, "title": m.title, "project_id": m.project_id, "project_name": proj.name if proj else None, "due_date": m.due_date, "status": m.status, "description": m.description}


class MilestoneInput(BaseModel):
    title: str
    project_id: int
    due_date: str
    status: str = "pending"
    description: Optional[str] = None


class MilestoneUpdate(BaseModel):
    title: Optional[str] = None
    due_date: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None


@router.get("")
def list_milestones(project_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(models.Milestone)
    if project_id:
        q = q.filter(models.Milestone.project_id == project_id)
    return [ms_to_dict(m, db) for m in q.all()]


@router.post("", status_code=201)
def create_milestone(body: MilestoneInput, db: Session = Depends(get_db)):
    m = models.Milestone(**body.model_dump())
    db.add(m)
    db.commit()
    db.refresh(m)
    return ms_to_dict(m, db)


@router.patch("/{id}")
def update_milestone(id: int, body: MilestoneUpdate, db: Session = Depends(get_db)):
    m = db.query(models.Milestone).filter(models.Milestone.id == id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(m, k, v)
    db.commit()
    db.refresh(m)
    return ms_to_dict(m, db)
