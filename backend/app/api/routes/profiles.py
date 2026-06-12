from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from app.database import get_db
from app import models
from app.core.security import get_current_user

router = APIRouter(prefix="/profiles", tags=["profiles"])


def profile_to_dict(p, user, emp):
    return {
        "id": p.id if p else None,
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "phone": p.phone if p else (emp.phone if emp else None),
        "address": p.address if p else None,
        "emergency_contact": p.emergency_contact if p else None,
        "emergency_phone": p.emergency_phone if p else None,
        "skills": p.skills if p else None,
        "bio": p.bio if p else None,
        "department": emp.department if emp else None,
        "position": emp.position if emp else None,
        "salary": emp.salary if emp else None,
        "joined_date": emp.joined_date if emp else None,
        "location": emp.location if emp else None,
        "updated_at": str(p.updated_at) if p else None,
    }


class ProfileUpdate(BaseModel):
    phone: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    skills: Optional[str] = None
    bio: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


@router.get("/me")
def get_my_profile(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    emp = db.query(models.Employee).filter(models.Employee.email == current_user.email).first()
    profile = db.query(models.EmployeeProfile).filter(
        models.EmployeeProfile.user_id == current_user.id
    ).first()
    return profile_to_dict(profile, current_user, emp)


@router.patch("/me")
def update_my_profile(body: ProfileUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    emp = db.query(models.Employee).filter(models.Employee.email == current_user.email).first()
    profile = db.query(models.EmployeeProfile).filter(
        models.EmployeeProfile.user_id == current_user.id
    ).first()
    if not profile:
        profile = models.EmployeeProfile(user_id=current_user.id)
        db.add(profile)
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(profile, k, v)
    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(profile)
    return profile_to_dict(profile, current_user, emp)


@router.post("/me/change-password")
def change_password(body: PasswordChange, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    from app.core.security import verify_password, get_password_hash
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.hashed_password = get_password_hash(body.new_password)
    db.commit()
    return {"message": "Password changed successfully"}
