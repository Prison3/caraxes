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


def ensure_indexes() -> None:
    db = get_database()
    db.users.create_index("username", unique=True)
    db.shops.create_index("name", unique=True)
    db.suppliers.create_index("name", unique=True)
    db.supplier_orders.create_index(
        [
            ("order_date", ASCENDING),
            ("shop_name", ASCENDING),
            ("supplier_name", ASCENDING),
        ],
        unique=True,
        name="uq_date_shop_supplier",
    )
    db.supplier_orders.create_index("order_date")
    db.supplier_orders.create_index("shop_name")


__all__ = [
    "ensure_indexes",
    "get_client",
    "get_database",
    "get_db",
    "next_id",
]
