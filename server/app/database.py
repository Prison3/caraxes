from __future__ import annotations

import os
from typing import Generator

from pymongo import ASCENDING, MongoClient, ReturnDocument
from pymongo.database import Database
MONGODB_URI = os.environ.get("MONGODB_URI", "mongodb://127.0.0.1:27017")
MONGODB_DB = os.environ.get("MONGODB_DB", "caraxes")

_client: MongoClient | None = None


def get_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(MONGODB_URI)
    return _client


def get_database() -> Database:
    return get_client()[MONGODB_DB]


def get_db() -> Generator[Database, None, None]:
    yield get_database()


def next_id(db: Database, collection_name: str) -> int:
    result = db.counters.find_one_and_update(
        {"_id": collection_name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return int(result["seq"])


def next_order_no(db: Database, order_date=None) -> str:
    """按日期+时分秒生成编号，例如 20260806143025。"""
    from datetime import date, datetime

    now = datetime.now().astimezone()
    if isinstance(order_date, datetime):
        stamp_dt = order_date if order_date.tzinfo else order_date.replace(tzinfo=now.tzinfo)
    elif isinstance(order_date, date):
        stamp_dt = now.replace(
            year=order_date.year, month=order_date.month, day=order_date.day
        )
    else:
        stamp_dt = now

    stamp = stamp_dt.strftime("%Y%m%d%H%M%S")
    seq = next_id(db, f"supplier_orders_no:{stamp}")
    if seq == 1:
        return stamp
    return f"{stamp}-{seq:02d}"


def _backfill_name_keys(collection) -> None:
    from .names import normalize_name

    for doc in collection.find({"name": {"$type": "string"}}):
        key = normalize_name(doc["name"])
        if doc.get("name_key") != key:
            collection.update_one({"_id": doc["_id"]}, {"$set": {"name_key": key}})


def ensure_indexes() -> None:
    db = get_database()
    db.users.create_index("username", unique=True)
    _backfill_name_keys(db.shops)
    _backfill_name_keys(db.suppliers)
    db.shops.create_index("name", unique=True)
    db.suppliers.create_index("name", unique=True)
    db.shops.create_index("name_key", unique=True)
    db.suppliers.create_index("name_key", unique=True)
    # 允许同日同店同供应商多笔订单；去掉历史唯一索引
    try:
        db.supplier_orders.drop_index("uq_date_shop_supplier")
    except Exception:
        pass
    db.supplier_orders.create_index(
        [
            ("order_date", ASCENDING),
            ("shop_name", ASCENDING),
            ("supplier_name", ASCENDING),
        ],
        name="idx_date_shop_supplier",
    )
    db.supplier_orders.create_index("order_date")
    db.supplier_orders.create_index("shop_name")
    db.supplier_orders.create_index("order_no", unique=True, sparse=True)
    db.deletion_logs.create_index([("deleted_at", ASCENDING), ("_id", ASCENDING)])


__all__ = [
    "ensure_indexes",
    "get_client",
    "get_database",
    "get_db",
    "next_id",
    "next_order_no",
]
