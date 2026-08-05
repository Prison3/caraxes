from __future__ import annotations

from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .database import get_db
from .models import SupplierOrder
from .schemas import OrderCreate, OrderOut, OrderUpdate

router = APIRouter(prefix="/api/orders", tags=["orders"])


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
    order_date: Optional[date] = Query(None, description="按日期筛选"),
    shop_name: Optional[str] = Query(None, description="按店铺名筛选（模糊）"),
    supplier_name: Optional[str] = Query(None, description="按供应商名筛选（模糊）"),
    limit: Optional[int] = Query(
        None, ge=1, le=100, description="返回条数上限（按最近优先）"
    ),
    db: Session = Depends(get_db),
):
    query = db.query(SupplierOrder)
    if order_date is not None:
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
