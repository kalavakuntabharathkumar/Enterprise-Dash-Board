from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.core.security import get_current_user, get_admin_user

router = APIRouter(prefix="/rbac", tags=["rbac"])


def permission_to_dict(p: models.Permission):
    return {
        "id": p.id,
        "name": p.name,
        "description": p.description,
        "module": p.module,
    }


def role_to_dict(r: models.Role, permissions=None):
    d = {
        "id": r.id,
        "name": r.name,
        "description": r.description,
        "is_system": r.is_system,
        "created_at": str(r.created_at),
    }
    if permissions is not None:
        d["permissions"] = permissions
    return d


@router.get("/roles")
def list_roles(db: Session = Depends(get_db), _=Depends(get_current_user)):
    roles = db.query(models.Role).order_by(models.Role.id).all()
    result = []
    for r in roles:
        rps = db.query(models.RolePermission).filter(models.RolePermission.role_id == r.id).all()
        perm_ids = [rp.permission_id for rp in rps]
        perms = db.query(models.Permission).filter(models.Permission.id.in_(perm_ids)).all()
        result.append(role_to_dict(r, [permission_to_dict(p) for p in perms]))
    return result


@router.get("/permissions")
def list_permissions(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return [permission_to_dict(p) for p in db.query(models.Permission).order_by(models.Permission.id).all()]


@router.get("/roles/{role_id}/permissions")
def get_role_permissions(role_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    rps = db.query(models.RolePermission).filter(models.RolePermission.role_id == role_id).all()
    perm_ids = [rp.permission_id for rp in rps]
    perms = db.query(models.Permission).filter(models.Permission.id.in_(perm_ids)).all()
    return role_to_dict(role, [permission_to_dict(p) for p in perms])


@router.get("/users/me/permissions")
def get_my_permissions(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if not current_user.role_id:
        return {"role": current_user.role, "permissions": []}
    rps = db.query(models.RolePermission).filter(models.RolePermission.role_id == current_user.role_id).all()
    perm_ids = [rp.permission_id for rp in rps]
    perms = db.query(models.Permission).filter(models.Permission.id.in_(perm_ids)).all()
    return {"role": current_user.role, "role_id": current_user.role_id, "permissions": [permission_to_dict(p) for p in perms]}
