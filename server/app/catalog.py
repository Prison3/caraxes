from __future__ import annotations

from typing import Any, Mapping, Optional

from fastapi import HTTPException, status
from pymongo.database import Database

from .database import next_id
from .models import utcnow
from .names import normalize_name


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
