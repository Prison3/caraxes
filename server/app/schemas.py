from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class OrderCreate(BaseModel):
    order_date: date = Field(..., description="订单日期")
    shop_id: int = Field(..., gt=0, description="店铺 ID")
    supplier_id: int = Field(..., gt=0, description="供应商 ID")
    daily_total: float = Field(..., gt=0, description="单日总金额（浮点数）")


class OrderUpdate(BaseModel):
    order_date: Optional[date] = Field(None, description="订单日期")
    shop_id: Optional[int] = Field(None, gt=0, description="店铺 ID")
    supplier_id: Optional[int] = Field(None, gt=0, description="供应商 ID")
    daily_total: Optional[float] = Field(
        None, gt=0, description="单日总金额（浮点数）"
    )


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_no: str
    order_date: date
    shop_id: int
    shop_name: str
    supplier_id: int
    supplier_name: str
    daily_total: float
    created_at: datetime
    updated_at: datetime


class LoginIn(BaseModel):
    username: str = Field(..., min_length=1, max_length=64, description="用户名")
    password: str = Field(..., min_length=1, max_length=128, description="密码")


class PasswordChangeIn(BaseModel):
    old_password: str = Field(..., min_length=1, max_length=128, description="当前密码")
    new_password: str = Field(..., min_length=4, max_length=128, description="新密码")


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    role: str = "admin"
    shop_id: Optional[int] = None
    shop_name: Optional[str] = None
    disabled: bool = False


class ManagerCreate(BaseModel):
    username: str = Field(..., min_length=1, max_length=64, description="店长用户名")
    password: str = Field(..., min_length=4, max_length=128, description="登录密码")
    shop_id: int = Field(..., gt=0, description="绑定店铺 ID")


class ManagerDisabledIn(BaseModel):
    disabled: bool = Field(..., description="是否禁用")


class ManagerUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=1, max_length=64, description="店长用户名")
    password: Optional[str] = Field(None, min_length=4, max_length=128, description="登录密码")
    shop_id: Optional[int] = Field(None, gt=0, description="绑定店铺 ID")


class ManagerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    role: str
    shop_id: Optional[int]
    shop_name: Optional[str]
    disabled: bool = False
    created_at: datetime


class NameCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200, description="名称")


class ShopOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    created_at: datetime
    month_total: float = 0.0


class SupplierOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    created_at: datetime
    month_total: float = 0.0


class CostItem(BaseModel):
    id: int
    name: str
    total: float
    count: int = 0


class CostBucket(BaseModel):
    key: str
    label: str
    total: float
    count: int = 0


class CostReportOut(BaseModel):
    group_by: str
    period: str
    date_from: date
    date_to: date
    total: float
    count: int = 0
    selected: str = ""
    items: List[CostItem] = []
    buckets: List[CostBucket] = []


class AppReleaseOut(BaseModel):
    version_name: str
    version_code: int
    filename: str
    size_bytes: int
    updated_at: str
    download_url: str
