from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import timedelta
from app.database import get_db
from app import models
from app.core.security import verify_password, get_password_hash, create_access_token, get_current_user
from app.core.config import ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginInput(BaseModel):
    email: str
    password: str


class RegisterInput(BaseModel):
    name: str
    email: str
    password: str
    role: str = "user"


def user_to_dict(u):
    return {"id": u.id, "name": u.name, "email": u.email, "role": u.role, "avatar": u.avatar, "created_at": str(u.created_at)}


@router.post("/login")
def login(body: LoginInput, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token({"sub": str(user.id)}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": token, "token_type": "bearer", "user": user_to_dict(user)}


@router.post("/register", status_code=201)
def register(body: RegisterInput, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = models.User(name=body.name, email=body.email, hashed_password=get_password_hash(body.password), role=body.role)
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id)}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": token, "token_type": "bearer", "user": user_to_dict(user)}


@router.get("/me")
def get_me(current_user=Depends(get_current_user)):
    return user_to_dict(current_user)
