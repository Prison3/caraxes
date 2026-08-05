from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class OrderCreate(BaseModel):
    order_date: date = Field(..., description="订单日期")
    shop_name: str = Field(..., min_length=1, max_length=200, description="店铺名")
    supplier_name: str = Field(..., min_length=1, max_length=200, description="供应商名")
    daily_total: float = Field(..., gt=0, description="单日总金额（浮点数）")


class OrderUpdate(BaseModel):
    order_date: Optional[date] = Field(None, description="订单日期")
    shop_name: Optional[str] = Field(
        None, min_length=1, max_length=200, description="店铺名"
    )
    supplier_name: Optional[str] = Field(
        None, min_length=1, max_length=200, description="供应商名"
    )
    daily_total: Optional[float] = Field(
        None, gt=0, description="单日总金额（浮点数）"
    )


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_date: date
    shop_name: str
    supplier_name: str
    daily_total: float
    created_at: datetime
    updated_at: datetime


class NameCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200, description="名称")


class ShopOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    created_at: datetime


class SupplierOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    created_at: datetime
