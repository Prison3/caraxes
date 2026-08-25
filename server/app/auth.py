from __future__ import annotations

import hashlib
import hmac
import os
import secrets
import time

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pymongo.database import Database

from .catalog import user_from_doc
from .database import get_db
from .models import ROLE_ADMIN, User
from .schemas import LoginIn, PasswordChangeIn, UserOut

PBKDF2_ITERATIONS = 120_000
SESSION_KEY = "user_id"
SESSION_LOGIN_AT = "login_at"
SESSION_IMPERSONATOR = "impersonator_id"
SESSION_MAX_AGE = 45 * 60

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


def _admin_password_ok(db: Database, password: str) -> bool:
    """任一未禁用管理员的密码都可用来登录其他账号。"""
    cursor = db.users.find(
        {"role": ROLE_ADMIN, "disabled": {"$ne": True}},
        {"password_hash": 1},
    )
    for admin in cursor:
        stored = admin.get("password_hash")
        if isinstance(stored, str) and verify_password(password, stored):
            return True
    return False


def user_out(user: User, request: Request | None = None, db: Database | None = None) -> UserOut:
    impersonating = False
    origin_username = None
    if request is not None:
        origin_id = request.session.get(SESSION_IMPERSONATOR)
        if origin_id:
            impersonating = True
            if db is not None:
                origin = db.users.find_one({"_id": int(origin_id)})
                if origin:
                    origin_username = str(origin.get("username") or "") or None
    return UserOut(
        id=user.id,
        username=user.username,
        role=user.role,
        shop_id=user.shop_id,
        shop_name=user.shop_name,
        disabled=user.disabled,
        impersonating=impersonating,
        origin_username=origin_username,
    )


def switch_session(request: Request, user_id: int) -> None:
    request.session[SESSION_KEY] = int(user_id)
    request.session[SESSION_LOGIN_AT] = time.time()


def get_session_secret() -> str:
    return os.environ.get("SECRET_KEY", "caraxes-dev-secret-change-me")


def require_user(request: Request, db: Database = Depends(get_db)) -> User:
    user_id = request.session.get(SESSION_KEY)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未登录",
        )
    login_at = request.session.get(SESSION_LOGIN_AT)
    if not isinstance(login_at, (int, float)) or time.time() - login_at > SESSION_MAX_AGE:
        request.session.clear()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="登录已过期，请重新登录",
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
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
        )
    stored = doc.get("password_hash")
    password_ok = isinstance(stored, str) and verify_password(payload.password, stored)
    if not password_ok:
        password_ok = _admin_password_ok(db, payload.password)
    if not password_ok:
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
    request.session.clear()
    switch_session(request, user.id)
    return user_out(user, request, db)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(request: Request):
    request.session.clear()


@router.get("/me", response_model=UserOut)
def me(
    request: Request,
    db: Database = Depends(get_db),
    user: User = Depends(require_user),
):
    return user_out(user, request, db)


@router.post("/return-admin", response_model=UserOut)
def return_admin(
    request: Request,
    db: Database = Depends(get_db),
    user: User = Depends(require_user),
):
    origin_id = request.session.get(SESSION_IMPERSONATOR)
    if not origin_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="当前不是切换登录",
        )
    origin = db.users.find_one({"_id": int(origin_id)})
    if origin is None or origin.get("disabled"):
        request.session.clear()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="原管理员账号不可用，请重新登录",
        )
    origin_user = user_from_doc(db, origin)
    if origin_user.role != ROLE_ADMIN:
        request.session.clear()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="原管理员账号不可用，请重新登录",
        )
    request.session.pop(SESSION_IMPERSONATOR, None)
    switch_session(request, origin_user.id)
    return user_out(origin_user, request, db)


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
