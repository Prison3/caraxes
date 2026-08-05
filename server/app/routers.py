from __future__ import annotations

import calendar
import re
from datetime import date
from typing import List, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .database import get_db
from .models import SupplierOrder
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
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    order = SupplierOrder(
        order_date=payload.order_date,
        shop_name=payload.shop_name.strip(),
        supplier_name=payload.supplier_name.strip(),
        daily_total=payload.daily_total,
    )
    db.add(order)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="该日期下此店铺的该供应商订单已存在",
        )
    db.refresh(order)
    return order


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
    db: Session = Depends(get_db),
):
    query = db.query(SupplierOrder)

    if month is not None:
        if not _MONTH_RE.match(month):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="month 格式应为 YYYY-MM",
            )
        start, end = _month_bounds(month)
        query = query.filter(
            SupplierOrder.order_date >= start,
            SupplierOrder.order_date <= end,
        )
    elif date_from is not None or date_to is not None:
        if date_from is not None and date_to is not None and date_from > date_to:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="起始日期不能晚于结束日期",
            )
        if date_from is not None:
            query = query.filter(SupplierOrder.order_date >= date_from)
        if date_to is not None:
            query = query.filter(SupplierOrder.order_date <= date_to)
    elif order_date is not None:
        query = query.filter(SupplierOrder.order_date == order_date)

    if shop_name:
        query = query.filter(SupplierOrder.shop_name.contains(shop_name.strip()))
    if supplier_name:
        query = query.filter(SupplierOrder.supplier_name.contains(supplier_name.strip()))
    if limit is not None:
        query = query.order_by(
            SupplierOrder.created_at.desc(),
            SupplierOrder.id.desc(),
        ).limit(limit)
    else:
        query = query.order_by(
            SupplierOrder.order_date.desc(),
            SupplierOrder.id.desc(),
        )
    return query.all()


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.get(SupplierOrder, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在")
    return order


@router.put("/{order_id}", response_model=OrderOut)
def update_order(order_id: int, payload: OrderUpdate, db: Session = Depends(get_db)):
    order = db.get(SupplierOrder, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在")

    data = _strip_fields(payload.model_dump(exclude_unset=True))
    for key, value in data.items():
        setattr(order, key, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="该日期下此店铺的该供应商订单已存在",
        )
    db.refresh(order)
    return order


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.get(SupplierOrder, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在")
    db.delete(order)
    db.commit()
