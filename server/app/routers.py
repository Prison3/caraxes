from __future__ import annotations

import calendar
import re
from datetime import date
from typing import List, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pymongo import ReturnDocument
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError

from .database import get_db, next_id
from .models import SupplierOrder, build_order_doc, serialize_order_date, utcnow
from .schemas import OrderCreate, OrderOut, OrderUpdate

router = APIRouter(prefix="/api/orders", tags=["orders"])

_MONTH_RE = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")


def _month_bounds(month: str) -> Tuple[date, date]:
    year, mon = map(int, month.split("-"))
    start = date(year, mon, 1)
    end = date(year, mon, calendar.monthrange(year, mon)[1])
    return start, end


def _strip_fields(data: dict) -> dict:
    for key in ("shop_name", "supplier_name"):
        if key in data and data[key] is not None:
            data[key] = data[key].strip()
    return data


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, db: Database = Depends(get_db)):
    doc = build_order_doc(
        order_id=next_id(db, "supplier_orders"),
        order_date=payload.order_date,
        shop_name=payload.shop_name.strip(),
        supplier_name=payload.supplier_name.strip(),
        daily_total=payload.daily_total,
    )
    try:
        db.supplier_orders.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="该日期下此店铺的该供应商订单已存在",
        )
    return SupplierOrder.from_doc(doc)


@router.get("", response_model=List[OrderOut])
def list_orders(
    order_date: Optional[date] = Query(None, description="按单日筛选"),
    date_from: Optional[date] = Query(None, description="起始日期（含）"),
    date_to: Optional[date] = Query(None, description="结束日期（含）"),
    month: Optional[str] = Query(
        None, description="按月份筛选，格式 YYYY-MM，例如 2026-08"
    ),
    shop_name: Optional[str] = Query(None, description="按店铺名筛选（模糊）"),
    supplier_name: Optional[str] = Query(None, description="按供应商名筛选（模糊）"),
    limit: Optional[int] = Query(
        None, ge=1, le=100, description="返回条数上限（按最近优先）"
    ),
    db: Database = Depends(get_db),
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

    if shop_name:
        filters["shop_name"] = {"$regex": re.escape(shop_name.strip())}
    if supplier_name:
        filters["supplier_name"] = {"$regex": re.escape(supplier_name.strip())}

    cursor = db.supplier_orders.find(filters)
    if limit is not None:
        cursor = cursor.sort([("created_at", -1), ("_id", -1)]).limit(limit)
    else:
        cursor = cursor.sort([("order_date", -1), ("_id", -1)])
    return [SupplierOrder.from_doc(doc) for doc in cursor]


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Database = Depends(get_db)):
    doc = db.supplier_orders.find_one({"_id": order_id})
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在")
    return SupplierOrder.from_doc(doc)


@router.put("/{order_id}", response_model=OrderOut)
def update_order(order_id: int, payload: OrderUpdate, db: Database = Depends(get_db)):
    existing = db.supplier_orders.find_one({"_id": order_id})
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在")

    data = _strip_fields(payload.model_dump(exclude_unset=True))
    if "order_date" in data and data["order_date"] is not None:
        data["order_date"] = serialize_order_date(data["order_date"])
    if not data:
        return SupplierOrder.from_doc(existing)

    data["updated_at"] = utcnow()
    try:
        result = db.supplier_orders.find_one_and_update(
            {"_id": order_id},
            {"$set": data},
            return_document=ReturnDocument.AFTER,
        )
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="该日期下此店铺的该供应商订单已存在",
        )
    return SupplierOrder.from_doc(result)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Database = Depends(get_db)):
    result = db.supplier_orders.delete_one({"_id": order_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在")
