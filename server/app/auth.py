from __future__ import annotations

import hashlib
import hmac
import os
import secrets

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pymongo.database import Database

from .catalog import user_from_doc
from .database import get_db
from .models import User
from .schemas import LoginIn, PasswordChangeIn, UserOut

PBKDF2_ITERATIONS = 120_000
SESSION_KEY = "user_id"

router = APIRouter(prefix="/api/auth", tags=["auth"])


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        PBKDF2_ITERATIONS,
    )
    return f"{salt}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt, expected = stored.split("$", 1)
    except ValueError:
        return False
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        PBKDF2_ITERATIONS,
    )
    return hmac.compare_digest(digest.hex(), expected)


def get_session_secret() -> str:
    return os.environ.get("SECRET_KEY", "caraxes-dev-secret-change-me")


def require_user(request: Request, db: Database = Depends(get_db)) -> User:
    user_id = request.session.get(SESSION_KEY)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未登录",
        )
    doc = db.users.find_one({"_id": int(user_id)})
    if doc is None:
        request.session.clear()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未登录",
        )
    if doc.get("disabled"):
        request.session.clear()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="账号已被禁用",
        )
    return user_from_doc(db, doc)


@router.post("/login", response_model=UserOut)
def login(payload: LoginIn, request: Request, db: Database = Depends(get_db)):
    username = payload.username.strip()
    doc = db.users.find_one({"username": username})
    if doc is None or not verify_password(payload.password, doc["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
        )
    if doc.get("disabled"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="账号已被禁用",
        )
    user = user_from_doc(db, doc)
    request.session[SESSION_KEY] = user.id
    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(request: Request):
    request.session.clear()


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(require_user)):
    return user


@router.put("/password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: PasswordChangeIn,
    user: User = Depends(require_user),
    db: Database = Depends(get_db),
):
    doc = db.users.find_one({"_id": user.id})
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未登录",
        )
    if not verify_password(payload.old_password, doc["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="当前密码错误",
        )
    new_password = payload.new_password
    if new_password == payload.old_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="新密码不能与当前密码相同",
        )
    db.users.update_one(
        {"_id": user.id},
        {"$set": {"password_hash": hash_password(new_password)}},
    )
