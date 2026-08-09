from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class OrderCreate(BaseModel):
    order_date: date = Field(..., description="订单日期")
    shop_name: str = Field(..., min_length=1, max_length=200, description="店铺名")
    supplier_id: int = Field(..., gt=0, description="供应商 ID")
    daily_total: float = Field(..., gt=0, description="单日总金额（浮点数）")


class OrderUpdate(BaseModel):
    order_date: Optional[date] = Field(None, description="订单日期")
    shop_name: Optional[str] = Field(
        None, min_length=1, max_length=200, description="店铺名"
    )
    supplier_id: Optional[int] = Field(None, gt=0, description="供应商 ID")
    daily_total: Optional[float] = Field(
        None, gt=0, description="单日总金额（浮点数）"
    )


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_no: str
    order_date: date
    shop_name: str
    supplier_id: int
    supplier_name: str
    daily_total: float
    created_at: datetime
    updated_at: datetime


class LoginIn(BaseModel):
    username: str = Field(..., min_length=1, max_length=64, description="用户名")
    password: str = Field(..., min_length=1, max_length=128, description="密码")


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    role: str = "admin"
    shop_name: Optional[str] = None


class ManagerCreate(BaseModel):
    username: str = Field(..., min_length=1, max_length=64, description="店长用户名")
    password: str = Field(..., min_length=4, max_length=128, description="登录密码")
    shop_name: str = Field(..., min_length=1, max_length=200, description="绑定店铺")


class ManagerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    role: str
    shop_name: Optional[str]
    created_at: datetime


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
