import hashlib
import hmac
import os
import binascii
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.config import SECRET_KEY, ALGORITHM
from app.database import get_db

bearer_scheme = HTTPBearer(auto_error=False)

HASH_ALGO = "sha256"
ITERATIONS = 260000


def get_password_hash(password: str) -> str:
    salt = binascii.hexlify(os.urandom(16)).decode()
    dk = hashlib.pbkdf2_hmac(HASH_ALGO, password.encode(), salt.encode(), ITERATIONS)
    return f"pbkdf2:{HASH_ALGO}:{ITERATIONS}${salt}${binascii.hexlify(dk).decode()}"


def verify_password(plain_password: str, stored_hash: str) -> bool:
    try:
        if stored_hash.startswith("pbkdf2:"):
            _, algo_iters, rest = stored_hash.split("$", 2)
            _, algo, iters_str = algo_iters.rsplit(":", 2)
            salt, expected_hex = rest.split("$", 1)
            iters = int(iters_str)
            dk = hashlib.pbkdf2_hmac(algo, plain_password.encode(), salt.encode(), iters)
            return hmac.compare_digest(binascii.hexlify(dk).decode(), expected_hex)
        return False
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=60))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    from app import models
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if not user_id:
            return None
        from app import models
        return db.query(models.User).filter(models.User.id == int(user_id)).first()
    except JWTError:
        return None
