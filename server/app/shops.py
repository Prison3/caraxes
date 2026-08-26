from __future__ import annotations

import calendar
from datetime import date
from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError

from .auth import require_user
from .confirm import require_admin_confirm
from .database import get_db, next_id
from .models import Shop, User, serialize_order_date, utcnow
from .names import normalize_name
from .roles import require_admin, scoped_shop_id
from .schemas import NameCreate, ShopOut
from .seed import create_default_manager_for_shop

router = APIRouter(prefix="/api/shops", tags=["shops"])


def _current_month_totals(db: Database, shop_ids: List[int]) -> Dict[int, float]:
    if not shop_ids:
        return {}
    today = date.today()
    start = date(today.year, today.month, 1)
    end = date(today.year, today.month, calendar.monthrange(today.year, today.month)[1])
    pipeline = [
        {
            "$match": {
                "shop_id": {"$in": [int(x) for x in shop_ids]},
                "order_date": {
                    "$gte": serialize_order_date(start),
                    "$lte": serialize_order_date(end),
                },
            }
        },
        {"$group": {"_id": "$shop_id", "total": {"$sum": "$daily_total"}}},
    ]
    totals: Dict[int, float] = {}
    for row in db.supplier_orders.aggregate(pipeline):
        totals[int(row["_id"])] = float(row.get("total") or 0)
    return totals


@router.get("", response_model=List[ShopOut])
def list_shops(
    db: Database = Depends(get_db),
    user: User = Depends(require_user),
):
    scoped = scoped_shop_id(user)
    query = {"_id": scoped} if scoped is not None else {}
    docs = list(db.shops.find(query).sort("name", 1))
    totals = _current_month_totals(db, [int(d["_id"]) for d in docs])
    return [
        ShopOut(
            id=int(doc["_id"]),
            name=doc["name"],
            created_at=doc["created_at"],
            month_total=round(totals.get(int(doc["_id"]), 0.0), 2),
        )
        for doc in docs
    ]


@router.get("/{shop_id}", response_model=ShopOut)
def get_shop(
    shop_id: int,
    db: Database = Depends(get_db),
    user: User = Depends(require_user),
):
    scoped = scoped_shop_id(user)
    if scoped is not None and int(shop_id) != scoped:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="店铺不存在")
    doc = db.shops.find_one({"_id": shop_id})
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="店铺不存在")
    totals = _current_month_totals(db, [shop_id])
    return ShopOut(
        id=int(doc["_id"]),
        name=doc["name"],
        created_at=doc["created_at"],
        month_total=round(totals.get(shop_id, 0.0), 2),
    )


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
    if db.users.find_one({"username": name}):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"无法创建店铺：用户名「{name}」已被占用，无法自动创建店长",
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
    try:
        create_default_manager_for_shop(
            db,
            shop_id=int(doc["_id"]),
            shop_name=name,
            now=doc["created_at"],
        )
    except ValueError as exc:
        db.shops.delete_one({"_id": doc["_id"]})
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
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
    _admin: User = Depends(require_admin),
    _: None = Depends(require_admin_confirm),
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
        db.users.delete_many({"role": "manager", "shop_id": shop_id})
    db.shops.delete_one({"_id": shop_id})
