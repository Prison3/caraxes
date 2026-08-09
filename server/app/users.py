from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError

from .auth import hash_password
from .catalog import require_shop, user_from_doc
from .confirm import require_admin_confirm
from .database import get_db, next_id
from .models import ROLE_MANAGER, User, utcnow
from .roles import require_admin
from .schemas import ManagerCreate, ManagerDisabledIn, ManagerOut

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


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_manager(
    user_id: int,
    db: Database = Depends(get_db),
    _: User = Depends(require_admin),
    __: None = Depends(require_admin_confirm),
):
    _require_manager_doc(db, user_id)
    db.users.delete_one({"_id": user_id})
