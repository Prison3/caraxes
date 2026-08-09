from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError

from .auth import hash_password
from .confirm import require_admin_confirm
from .database import get_db, next_id
from .models import ROLE_MANAGER, User, utcnow
from .roles import require_admin
from .schemas import ManagerCreate, ManagerOut

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=List[ManagerOut])
def list_managers(
    db: Database = Depends(get_db),
    _: User = Depends(require_admin),
):
    cursor = db.users.find({"role": ROLE_MANAGER}).sort("_id", 1)
    return [User.from_doc(doc) for doc in cursor]


@router.post("", response_model=ManagerOut, status_code=status.HTTP_201_CREATED)
def create_manager(
    payload: ManagerCreate,
    db: Database = Depends(get_db),
    _: User = Depends(require_admin),
):
    username = payload.username.strip()
    shop_name = " ".join(payload.shop_name.strip().split())
    if not username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="用户名不能为空")
    if not shop_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="店铺名不能为空")
    if db.shops.find_one({"name": shop_name}) is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="店铺不存在")
    if db.users.find_one({"username": username}):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="用户名已存在")

    doc = {
        "_id": next_id(db, "users"),
        "username": username,
        "password_hash": hash_password(payload.password),
        "role": ROLE_MANAGER,
        "shop_name": shop_name,
        "created_at": utcnow(),
    }
    try:
        db.users.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="用户名已存在")
    return User.from_doc(doc)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_manager(
    user_id: int,
    db: Database = Depends(get_db),
    _: User = Depends(require_admin),
    __: None = Depends(require_admin_confirm),
):
    doc = db.users.find_one({"_id": user_id})
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")
    user = User.from_doc(doc)
    if user.role != ROLE_MANAGER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="只能删除店长账号",
        )
    db.users.delete_one({"_id": user_id})
