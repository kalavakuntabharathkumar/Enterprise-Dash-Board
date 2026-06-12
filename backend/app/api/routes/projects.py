from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from app.database import get_db
from app import models

router = APIRouter(prefix="/projects", tags=["projects"])


def proj_to_dict(p):
    return {
        "id": p.id, "name": p.name, "description": p.description,
        "status": p.status, "progress": p.progress,
        "start_date": p.start_date, "end_date": p.end_date,
        "manager": p.manager, "team": [], "priority": p.priority,
    }


class ProjectInput(BaseModel):
    name: str
    status: str
    start_date: str
    end_date: str
    description: Optional[str] = None
    progress: int = 0
    manager: Optional[str] = None
    priority: str = "medium"


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    progress: Optional[int] = None
    end_date: Optional[str] = None
    manager: Optional[str] = None
    priority: Optional[str] = None


@router.get("")
def list_projects(status: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(models.Project)
    if status:
        q = q.filter(models.Project.status == status)
    return [proj_to_dict(p) for p in q.all()]


@router.post("", status_code=201)
def create_project(body: ProjectInput, db: Session = Depends(get_db)):
    p = models.Project(**body.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return proj_to_dict(p)


@router.get("/{id}")
def get_project(id: int, db: Session = Depends(get_db)):
    p = db.query(models.Project).filter(models.Project.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    return proj_to_dict(p)


@router.patch("/{id}")
def update_project(id: int, body: ProjectUpdate, db: Session = Depends(get_db)):
    p = db.query(models.Project).filter(models.Project.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return proj_to_dict(p)


@router.delete("/{id}", status_code=204)
def delete_project(id: int, db: Session = Depends(get_db)):
    p = db.query(models.Project).filter(models.Project.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(p)
    db.commit()
