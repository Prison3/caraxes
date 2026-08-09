from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError

from .auth import require_user
from .confirm import require_admin_confirm
from .database import get_db, next_id
from .deletions import record_shop_deletion
from .models import Shop, User, utcnow
from .names import normalize_name
from .roles import require_admin, scoped_shop_id
from .schemas import NameCreate, ShopOut

router = APIRouter(prefix="/api/shops", tags=["shops"])


@router.get("", response_model=List[ShopOut])
def list_shops(
    db: Database = Depends(get_db),
    user: User = Depends(require_user),
):
    scoped = scoped_shop_id(user)
    query = {"_id": scoped} if scoped is not None else {}
    return [Shop.from_doc(doc) for doc in db.shops.find(query).sort("_id", 1)]


@router.post("", response_model=ShopOut, status_code=status.HTTP_201_CREATED)
def create_shop(
    payload: NameCreate,
    db: Database = Depends(get_db),
    _: User = Depends(require_admin),
):
    name = " ".join(payload.name.strip().split())
    if not name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="店铺名不能为空")
    name_key = normalize_name(name)
    if db.shops.find_one({"$or": [{"name": name}, {"name_key": name_key}]}):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="店铺名不可以重复",
        )
    doc = {
        "_id": next_id(db, "shops"),
        "name": name,
        "name_key": name_key,
        "created_at": utcnow(),
    }
    try:
        db.shops.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="店铺名不可以重复",
        )
    return Shop.from_doc(doc)


@router.put("/{shop_id}", response_model=ShopOut)
def update_shop(
    shop_id: int,
    payload: NameCreate,
    db: Database = Depends(get_db),
    _: User = Depends(require_admin),
):
    doc = db.shops.find_one({"_id": shop_id})
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="店铺不存在")

    name = " ".join(payload.name.strip().split())
    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="店铺名不能为空"
        )
    old_name = doc["name"]
    name_key = normalize_name(name)
    if name == old_name and doc.get("name_key") == name_key:
        return Shop.from_doc(doc)

    conflict = db.shops.find_one(
        {
            "_id": {"$ne": shop_id},
            "$or": [{"name": name}, {"name_key": name_key}],
        }
    )
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="店铺名不可以重复",
        )

    try:
        db.shops.update_one(
            {"_id": shop_id},
            {"$set": {"name": name, "name_key": name_key}},
        )
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="店铺名不可以重复",
        )

    # 同步店长展示字段（若仍存有旧名）
    if old_name != name:
        db.users.update_many(
            {"role": "manager", "shop_id": shop_id},
            {"$set": {"shop_name": name}},
        )

    updated = db.shops.find_one({"_id": shop_id})
    return Shop.from_doc(updated)


@router.delete("/{shop_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shop(
    shop_id: int,
    db: Database = Depends(get_db),
    _: User = Depends(require_admin),
    __: None = Depends(require_admin_confirm),
):
    doc = db.shops.find_one({"_id": shop_id})
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="店铺不存在")
    order_count = db.supplier_orders.count_documents({"shop_id": shop_id})
    if order_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"该店铺还有 {order_count} 笔订单，无法删除",
        )
    manager_count = db.users.count_documents({"role": "manager", "shop_id": shop_id})
    if manager_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"该店铺还有 {manager_count} 个店长账号，无法删除",
        )
    record_shop_deletion(db, shop_id, doc["name"])
    db.shops.delete_one({"_id": shop_id})
