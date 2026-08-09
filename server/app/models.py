from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timezone
from typing import Any, Mapping, Optional


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def parse_order_date(value: Any) -> date:
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, str):
        return date.fromisoformat(value[:10])
    raise TypeError(f"unsupported order_date type: {type(value)!r}")


def serialize_order_date(value: date) -> str:
    return value.isoformat()


ROLE_ADMIN = "admin"
ROLE_MANAGER = "manager"


@dataclass
class User:
    id: int
    username: str
    password_hash: str
    role: str
    shop_name: Optional[str]
    created_at: datetime

    @classmethod
    def from_doc(cls, doc: Mapping[str, Any]) -> "User":
        role = str(doc.get("role") or ROLE_ADMIN)
        if role not in (ROLE_ADMIN, ROLE_MANAGER):
            role = ROLE_ADMIN
        shop_name = doc.get("shop_name")
        return cls(
            id=int(doc["_id"]),
            username=doc["username"],
            password_hash=doc["password_hash"],
            role=role,
            shop_name=str(shop_name).strip() if shop_name else None,
            created_at=doc["created_at"],
        )


@dataclass
class Shop:
    id: int
    name: str
    created_at: datetime

    @classmethod
    def from_doc(cls, doc: Mapping[str, Any]) -> "Shop":
        return cls(
            id=int(doc["_id"]),
            name=doc["name"],
            created_at=doc["created_at"],
        )


@dataclass
class Supplier:
    id: int
    name: str
    created_at: datetime

    @classmethod
    def from_doc(cls, doc: Mapping[str, Any]) -> "Supplier":
        return cls(
            id=int(doc["_id"]),
            name=doc["name"],
            created_at=doc["created_at"],
        )


@dataclass
class SupplierOrder:
    id: int
    order_no: str
    order_date: date
    shop_name: str
    supplier_name: str
    daily_total: float
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_doc(cls, doc: Mapping[str, Any]) -> "SupplierOrder":
        order_date = parse_order_date(doc["order_date"])
        order_id = int(doc["_id"])
        order_no = doc.get("order_no")
        if not order_no:
            created = doc.get("created_at")
            if isinstance(created, datetime):
                order_no = created.astimezone().strftime("%Y%m%d%H%M%S")
            else:
                order_no = f"{order_date.strftime('%Y%m%d')}000000"
            order_no = f"{order_no}-{order_id:02d}"
        return cls(
            id=order_id,
            order_no=str(order_no),
            order_date=order_date,
            shop_name=doc["shop_name"],
            supplier_name=doc["supplier_name"],
            daily_total=float(doc["daily_total"]),
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
        )


def build_order_doc(
    *,
    order_id: int,
    order_no: str,
    order_date: date,
    shop_name: str,
    supplier_name: str,
    daily_total: float,
    created_at: Optional[datetime] = None,
    updated_at: Optional[datetime] = None,
) -> dict[str, Any]:
    now = utcnow()
    return {
        "_id": order_id,
        "order_no": order_no,
        "order_date": serialize_order_date(order_date),
        "shop_name": shop_name,
        "supplier_name": supplier_name,
        "daily_total": float(daily_total),
        "created_at": created_at or now,
        "updated_at": updated_at or now,
    }
