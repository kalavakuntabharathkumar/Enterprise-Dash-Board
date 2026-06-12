from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from app.database import get_db
from app import models

router = APIRouter(prefix="/tasks", tags=["tasks"])


def task_to_dict(t, db):
    proj = db.query(models.Project).filter(models.Project.id == t.project_id).first() if t.project_id else None
    return {
        "id": t.id, "title": t.title, "description": t.description,
        "status": t.status, "priority": t.priority,
        "project_id": t.project_id,
        "project_name": proj.name if proj else None,
        "assignee": t.assignee, "due_date": t.due_date, "created_at": str(t.created_at),
    }


class TaskInput(BaseModel):
    title: str
    status: str = "todo"
    priority: str = "medium"
    description: Optional[str] = None
    project_id: Optional[int] = None
    assignee: Optional[str] = None
    due_date: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee: Optional[str] = None
    due_date: Optional[str] = None


@router.get("")
def list_tasks(project_id: Optional[int] = None, status: Optional[str] = None, assignee_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(models.Task)
    if project_id:
        q = q.filter(models.Task.project_id == project_id)
    if status:
        q = q.filter(models.Task.status == status)
    return [task_to_dict(t, db) for t in q.order_by(models.Task.created_at.desc()).all()]


@router.post("", status_code=201)
def create_task(body: TaskInput, db: Session = Depends(get_db)):
    t = models.Task(**body.model_dump())
    db.add(t)
    db.commit()
    db.refresh(t)
    return task_to_dict(t, db)


@router.patch("/{id}")
def update_task(id: int, body: TaskUpdate, db: Session = Depends(get_db)):
    t = db.query(models.Task).filter(models.Task.id == id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(t, k, v)
    db.commit()
    db.refresh(t)
    return task_to_dict(t, db)


@router.delete("/{id}", status_code=204)
def delete_task(id: int, db: Session = Depends(get_db)):
    t = db.query(models.Task).filter(models.Task.id == id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(t)
    db.commit()
