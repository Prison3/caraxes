from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError

from .auth import SESSION_IMPERSONATOR, hash_password, switch_session, user_out
from .catalog import require_shop, user_from_doc
from .confirm import require_admin_confirm
from .database import get_db, next_id
from .models import ROLE_MANAGER, User, utcnow
from .roles import require_admin
from .schemas import ManagerCreate, ManagerDisabledIn, ManagerOut, ManagerUpdate, UserOut

router = APIRouter(prefix="/api/users", tags=["users"])


def _require_manager_doc(db: Database, user_id: int):
    doc = db.users.find_one({"_id": user_id})
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")
    user = User.from_doc(doc)
    if user.role != ROLE_MANAGER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="只能操作店长账号",
        )
    return doc


@router.get("", response_model=List[ManagerOut])
def list_managers(
    db: Database = Depends(get_db),
    _: User = Depends(require_admin),
):
    cursor = db.users.find({"role": ROLE_MANAGER}).sort("_id", 1)
    return [user_from_doc(db, doc) for doc in cursor]


@router.post("", response_model=ManagerOut, status_code=status.HTTP_201_CREATED)
def create_manager(
    payload: ManagerCreate,
    db: Database = Depends(get_db),
    _: User = Depends(require_admin),
):
    username = payload.username.strip()
    if not username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="用户名不能为空")
    shop = require_shop(db, payload.shop_id)
    if db.users.find_one({"username": username}):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="用户名已存在")

    doc = {
        "_id": next_id(db, "users"),
        "username": username,
        "password_hash": hash_password(payload.password),
        "role": ROLE_MANAGER,
        "shop_id": int(shop["_id"]),
        "shop_name": shop["name"],
        "disabled": False,
        "created_at": utcnow(),
    }
    try:
        db.users.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="用户名已存在")
    return user_from_doc(db, doc)


@router.put("/{user_id}/disabled", response_model=ManagerOut)
def set_manager_disabled(
    user_id: int,
    payload: ManagerDisabledIn,
    db: Database = Depends(get_db),
    _: User = Depends(require_admin),
):
    _require_manager_doc(db, user_id)
    db.users.update_one(
        {"_id": user_id},
        {"$set": {"disabled": bool(payload.disabled)}},
    )
    updated = db.users.find_one({"_id": user_id})
    return user_from_doc(db, updated)


@router.put("/{user_id}", response_model=ManagerOut)
def update_manager(
    user_id: int,
    payload: ManagerUpdate,
    db: Database = Depends(get_db),
    _: User = Depends(require_admin),
):
    _require_manager_doc(db, user_id)
    data = payload.model_dump(exclude_unset=True)
    updates: dict = {}
    if "username" in data and data["username"] is not None:
        username = str(data["username"]).strip()
        if not username:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="用户名不能为空")
        conflict = db.users.find_one({"username": username, "_id": {"$ne": user_id}})
        if conflict:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="用户名已存在")
        updates["username"] = username
    if "password" in data and data["password"]:
        updates["password_hash"] = hash_password(str(data["password"]))
    if "shop_id" in data and data["shop_id"] is not None:
        shop = require_shop(db, int(data["shop_id"]))
        updates["shop_id"] = int(shop["_id"])
        updates["shop_name"] = shop["name"]
    if not updates:
        return user_from_doc(db, db.users.find_one({"_id": user_id}))
    try:
        db.users.update_one({"_id": user_id}, {"$set": updates})
    except DuplicateKeyError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="用户名已存在")
    updated = db.users.find_one({"_id": user_id})
    return user_from_doc(db, updated)


@router.post("/{user_id}/login", response_model=UserOut)
def login_as_manager(
    user_id: int,
    request: Request,
    db: Database = Depends(get_db),
    current: User = Depends(require_admin),
):
    doc = _require_manager_doc(db, user_id)
    if doc.get("disabled"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="账号已被禁用",
        )
    if int(doc["_id"]) == current.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="当前已是该账号",
        )
    if not request.session.get(SESSION_IMPERSONATOR):
        request.session[SESSION_IMPERSONATOR] = current.id
    switch_session(request, int(doc["_id"]))
    return user_out(user_from_doc(db, doc), request, db)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_manager(
    user_id: int,
    db: Database = Depends(get_db),
    _: User = Depends(require_admin),
    __: None = Depends(require_admin_confirm),
):
    _require_manager_doc(db, user_id)
    db.users.delete_one({"_id": user_id})
