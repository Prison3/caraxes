from __future__ import annotations

from typing import Any, Mapping, Optional

from fastapi import HTTPException, status
from pymongo.database import Database

from .database import next_id
from .models import ROLE_MANAGER, User, utcnow
from .names import normalize_name


def user_from_doc(db: Database, doc: Mapping[str, Any]) -> User:
    shop_name = None
    shop_id = doc.get("shop_id")
    if shop_id is not None:
        shop = get_shop(db, int(shop_id))
        if shop is not None:
            shop_name = shop["name"]
    return User.from_doc(doc, shop_name=shop_name)


def get_supplier(db: Database, supplier_id: int) -> Optional[Mapping[str, Any]]:
    return db.suppliers.find_one({"_id": int(supplier_id)})


def require_supplier(db: Database, supplier_id: int) -> Mapping[str, Any]:
    doc = get_supplier(db, supplier_id)
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="供应商不存在",
        )
    return doc


def supplier_name_map(db: Database, supplier_ids: set[int]) -> dict[int, str]:
    if not supplier_ids:
        return {}
    mapping: dict[int, str] = {}
    for doc in db.suppliers.find({"_id": {"$in": list(supplier_ids)}}):
        mapping[int(doc["_id"])] = doc["name"]
    return mapping


def ensure_supplier_by_name(db: Database, name: str) -> Mapping[str, Any]:
    clean = " ".join((name or "").strip().split())
    if not clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="供应商名不能为空",
        )
    existing = db.suppliers.find_one({"name": clean})
    if existing:
        return existing
    name_key = normalize_name(clean)
    existing = db.suppliers.find_one({"name_key": name_key})
    if existing:
        return existing
    doc = {
        "_id": next_id(db, "suppliers"),
        "name": clean,
        "name_key": name_key,
        "created_at": utcnow(),
    }
    db.suppliers.insert_one(doc)
    return doc


def get_shop(db: Database, shop_id: int) -> Optional[Mapping[str, Any]]:
    return db.shops.find_one({"_id": int(shop_id)})


def require_shop(db: Database, shop_id: int) -> Mapping[str, Any]:
    doc = get_shop(db, shop_id)
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="店铺不存在",
        )
    return doc


def shop_name_map(db: Database, shop_ids: set[int]) -> dict[int, str]:
    if not shop_ids:
        return {}
    mapping: dict[int, str] = {}
    for doc in db.shops.find({"_id": {"$in": list(shop_ids)}}):
        mapping[int(doc["_id"])] = doc["name"]
    return mapping


def ensure_shop_by_name(db: Database, name: str) -> Mapping[str, Any]:
    clean = " ".join((name or "").strip().split())
    if not clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="店铺名不能为空",
        )
    existing = db.shops.find_one({"name": clean})
    if existing:
        return existing
    name_key = normalize_name(clean)
    existing = db.shops.find_one({"name_key": name_key})
    if existing:
        return existing
    doc = {
        "_id": next_id(db, "shops"),
        "name": clean,
        "name_key": name_key,
        "created_at": utcnow(),
    }
    db.shops.insert_one(doc)
    return doc


def migrate_order_supplier_ids(db: Database) -> None:
    """历史订单按供应商名回填 supplier_id。"""
    cursor = db.supplier_orders.find(
        {
            "$or": [
                {"supplier_id": {"$exists": False}},
                {"supplier_id": None},
            ]
        }
    )
    for order in cursor:
        name = order.get("supplier_name")
        if not name:
            continue
        supplier = ensure_supplier_by_name(db, str(name))
        db.supplier_orders.update_one(
            {"_id": order["_id"]},
            {"$set": {"supplier_id": int(supplier["_id"])}},
        )


def migrate_order_shop_ids(db: Database) -> None:
    """历史订单按店铺名回填 shop_id。"""
    cursor = db.supplier_orders.find(
        {
            "$or": [
                {"shop_id": {"$exists": False}},
                {"shop_id": None},
            ]
        }
    )
    for order in cursor:
        name = order.get("shop_name")
        if not name:
            continue
        shop = ensure_shop_by_name(db, str(name))
        db.supplier_orders.update_one(
            {"_id": order["_id"]},
            {"$set": {"shop_id": int(shop["_id"])}},
        )


def migrate_manager_shop_ids(db: Database) -> None:
    """店长账号按店铺名回填 shop_id。"""
    cursor = db.users.find(
        {
            "role": ROLE_MANAGER,
            "$or": [
                {"shop_id": {"$exists": False}},
                {"shop_id": None},
            ],
        }
    )
    for user in cursor:
        name = user.get("shop_name")
        if not name:
            continue
        shop = ensure_shop_by_name(db, str(name))
        db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"shop_id": int(shop["_id"])}},
        )
