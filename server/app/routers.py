from __future__ import annotations

import calendar
import re
from datetime import date
from typing import List, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pymongo import ReturnDocument
from pymongo.database import Database

from .auth import require_user
from .catalog import require_shop, require_supplier, shop_name_map, supplier_name_map
from .confirm import require_admin_confirm
from .database import get_db, next_id, next_order_no
from .deletions import record_order_deletion
from .models import SupplierOrder, User, build_order_doc, serialize_order_date, utcnow
from .roles import scoped_shop_id
from .schemas import OrderCreate, OrderOut, OrderUpdate

router = APIRouter(prefix="/api/orders", tags=["orders"])

_MONTH_RE = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")


def _month_bounds(month: str) -> Tuple[date, date]:
    year, mon = map(int, month.split("-"))
    start = date(year, mon, 1)
    end = date(year, mon, calendar.monthrange(year, mon)[1])
    return start, end


def _ensure_order_access(user: User, shop_id: int) -> None:
    scoped = scoped_shop_id(user)
    if scoped is not None and int(shop_id) != scoped:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在")


def _order_out(db: Database, doc: dict) -> SupplierOrder:
    shop_ids = set()
    supplier_ids = set()
    if doc.get("shop_id") is not None:
        shop_ids.add(int(doc["shop_id"]))
    if doc.get("supplier_id") is not None:
        supplier_ids.add(int(doc["supplier_id"]))
    shops = shop_name_map(db, shop_ids)
    suppliers = supplier_name_map(db, supplier_ids)
    return SupplierOrder.from_doc(
        doc,
        shop_name=shops.get(int(doc["shop_id"])) if doc.get("shop_id") is not None else None,
        supplier_name=suppliers.get(int(doc["supplier_id"]))
        if doc.get("supplier_id") is not None
        else None,
    )


def _orders_out(db: Database, docs: list) -> List[SupplierOrder]:
    shop_ids = {int(d["shop_id"]) for d in docs if d.get("shop_id") is not None}
    supplier_ids = {int(d["supplier_id"]) for d in docs if d.get("supplier_id") is not None}
    shops = shop_name_map(db, shop_ids)
    suppliers = supplier_name_map(db, supplier_ids)
    return [
        SupplierOrder.from_doc(
            doc,
            shop_name=shops.get(int(doc["shop_id"]))
            if doc.get("shop_id") is not None
            else None,
            supplier_name=suppliers.get(int(doc["supplier_id"]))
            if doc.get("supplier_id") is not None
            else None,
        )
        for doc in docs
    ]


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreate,
    db: Database = Depends(get_db),
    user: User = Depends(require_user),
):
    shop_id = int(payload.shop_id)
    scoped = scoped_shop_id(user)
    if scoped is not None:
        if shop_id != scoped:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="店长只能录入本店订单",
            )
        shop_id = scoped

    shop = require_shop(db, shop_id)
    supplier = require_supplier(db, payload.supplier_id)
    doc = build_order_doc(
        order_id=next_id(db, "supplier_orders"),
        order_no=next_order_no(db, payload.order_date),
        order_date=payload.order_date,
        shop_id=int(shop["_id"]),
        supplier_id=int(supplier["_id"]),
        daily_total=payload.daily_total,
    )
    db.supplier_orders.insert_one(doc)
    return SupplierOrder.from_doc(
        doc,
        shop_name=shop["name"],
        supplier_name=supplier["name"],
    )


@router.get("", response_model=List[OrderOut])
def list_orders(
    order_date: Optional[date] = Query(None, description="按单日筛选"),
    date_from: Optional[date] = Query(None, description="起始日期（含）"),
    date_to: Optional[date] = Query(None, description="结束日期（含）"),
    month: Optional[str] = Query(
        None, description="按月份筛选，格式 YYYY-MM，例如 2026-08"
    ),
    shop_id: Optional[int] = Query(None, description="按店铺 ID 筛选"),
    shop_name: Optional[str] = Query(None, description="按店铺名筛选（模糊）"),
    supplier_id: Optional[int] = Query(None, description="按供应商 ID 筛选"),
    supplier_name: Optional[str] = Query(None, description="按供应商名筛选（模糊）"),
    limit: Optional[int] = Query(
        None, ge=1, le=100, description="返回条数上限（按最近优先）"
    ),
    db: Database = Depends(get_db),
    user: User = Depends(require_user),
):
    filters: dict = {}

    if month is not None:
        if not _MONTH_RE.match(month):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="month 格式应为 YYYY-MM",
            )
        start, end = _month_bounds(month)
        filters["order_date"] = {
            "$gte": serialize_order_date(start),
            "$lte": serialize_order_date(end),
        }
    elif date_from is not None or date_to is not None:
        if date_from is not None and date_to is not None and date_from > date_to:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="起始日期不能晚于结束日期",
            )
        date_filter: dict = {}
        if date_from is not None:
            date_filter["$gte"] = serialize_order_date(date_from)
        if date_to is not None:
            date_filter["$lte"] = serialize_order_date(date_to)
        filters["order_date"] = date_filter
    elif order_date is not None:
        filters["order_date"] = serialize_order_date(order_date)

    scoped = scoped_shop_id(user)
    if scoped is not None:
        filters["shop_id"] = scoped
    elif shop_id is not None:
        filters["shop_id"] = int(shop_id)
    elif shop_name:
        name = shop_name.strip()
        matched_ids = [
            int(doc["_id"])
            for doc in db.shops.find(
                {"name": {"$regex": re.escape(name)}},
                {"_id": 1},
            )
        ]
        if not matched_ids:
            return []
        filters["shop_id"] = {"$in": matched_ids}

    if supplier_id is not None:
        filters["supplier_id"] = int(supplier_id)
    elif supplier_name:
        name = supplier_name.strip()
        matched_ids = [
            int(doc["_id"])
            for doc in db.suppliers.find(
                {"name": {"$regex": re.escape(name)}},
                {"_id": 1},
            )
        ]
        if not matched_ids:
            return []
        filters["supplier_id"] = {"$in": matched_ids}

    cursor = db.supplier_orders.find(filters)
    if limit is not None:
        cursor = cursor.sort([("created_at", -1), ("_id", -1)]).limit(limit)
    else:
        cursor = cursor.sort([("order_date", -1), ("_id", -1)])
    return _orders_out(db, list(cursor))


@router.get("/{order_id}", response_model=OrderOut)
def get_order(
    order_id: int,
    db: Database = Depends(get_db),
    user: User = Depends(require_user),
):
    doc = db.supplier_orders.find_one({"_id": order_id})
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在")
    order = _order_out(db, doc)
    _ensure_order_access(user, order.shop_id)
    return order


@router.put("/{order_id}", response_model=OrderOut)
def update_order(
    order_id: int,
    payload: OrderUpdate,
    db: Database = Depends(get_db),
    user: User = Depends(require_user),
):
    existing = db.supplier_orders.find_one({"_id": order_id})
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在")
    order = _order_out(db, existing)
    _ensure_order_access(user, order.shop_id)

    data = payload.model_dump(exclude_unset=True)
    scoped = scoped_shop_id(user)
    if scoped is not None:
        if "shop_id" in data and data["shop_id"] is not None and int(data["shop_id"]) != scoped:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="店长不能修改为其他店铺",
            )
        data["shop_id"] = scoped
    if "shop_id" in data and data["shop_id"] is not None:
        require_shop(db, int(data["shop_id"]))
        data["shop_id"] = int(data["shop_id"])
    if "supplier_id" in data and data["supplier_id"] is not None:
        require_supplier(db, int(data["supplier_id"]))
        data["supplier_id"] = int(data["supplier_id"])
    if "order_date" in data and data["order_date"] is not None:
        data["order_date"] = serialize_order_date(data["order_date"])
    if not data:
        return order

    data["updated_at"] = utcnow()
    result = db.supplier_orders.find_one_and_update(
        {"_id": order_id},
        {"$set": data},
        return_document=ReturnDocument.AFTER,
    )
    return _order_out(db, result)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(
    order_id: int,
    db: Database = Depends(get_db),
    user: User = Depends(require_user),
    _: None = Depends(require_admin_confirm),
):
    doc = db.supplier_orders.find_one({"_id": order_id})
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在")
    order = _order_out(db, doc)
    _ensure_order_access(user, order.shop_id)
    record_order_deletion(db, order, operator=user)
    db.supplier_orders.delete_one({"_id": order_id})
