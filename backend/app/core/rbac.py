"""
Centralized RBAC permission utilities for Enterprise OS.

Design principles:
- role_id + RBAC tables are the primary source of truth
- Legacy users.role string is the fallback (backward compatible)
- Admin role string always grants full access during transition period
- All permission logic is in one place — never hardcode roles in routes
"""

from typing import Set
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security import get_current_user

# Fallback permissions for legacy role strings (used when role_id is NULL).
# This keeps existing admin/employee users working even before role_id is set.
_LEGACY_PERMISSIONS: dict[str, Set[str]] = {
    "admin": {
        "view_dashboard",
        "manage_employees",
        "approve_leave",
        "manage_payroll",
        "view_finance",
        "manage_projects",
        "view_analytics",
        "manage_settings",
    },
    "employee": {"view_dashboard"},
    "user": {"view_dashboard"},
}


def get_user_permissions(user, db: Session) -> Set[str]:
    """Return the full set of permission name strings for a user.

    Resolution order:
    1. If user.role_id is set → look up RolePermission rows in the DB.
    2. Otherwise → fall back to _LEGACY_PERMISSIONS keyed by user.role string.
    """
    if user.role_id is not None:
        from app import models
        rps = (
            db.query(models.RolePermission)
            .filter(models.RolePermission.role_id == user.role_id)
            .all()
        )
        perm_ids = [rp.permission_id for rp in rps]
        if perm_ids:
            perms = (
                db.query(models.Permission)
                .filter(models.Permission.id.in_(perm_ids))
                .all()
            )
            return {p.name for p in perms}
    return _LEGACY_PERMISSIONS.get(user.role, set())


def has_permission(user, permission_key: str, db: Session) -> bool:
    """Return True if the user holds the named permission."""
    return permission_key in get_user_permissions(user, db)


def require_permission(permission_key: str):
    """FastAPI dependency factory that enforces a named permission.

    Usage:
        @router.post("/employees")
        def create_employee(..., current_user=Depends(require_permission("manage_employees"))):
            ...

    Returns the authenticated user on success so routes can use it directly.
    Raises HTTP 403 with a clear message on failure.
    """
    def _dep(
        current_user=Depends(get_current_user),
        db: Session = Depends(get_db),
    ):
        if not has_permission(current_user, permission_key, db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: '{permission_key}' required.",
            )
        return current_user

    # Give the inner function a stable name so FastAPI's dependency cache works
    _dep.__name__ = f"require_{permission_key}"
    return _dep
