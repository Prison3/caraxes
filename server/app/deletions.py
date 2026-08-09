from __future__ import annotations

from datetime import datetime
from typing import Any, List, Mapping, Optional

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, ConfigDict
from pymongo.database import Database

from .confirm import require_admin_confirm
from .database import get_db, next_id
from .models import ROLE_ADMIN, ROLE_MANAGER, User, utcnow
from .roles import require_admin

router = APIRouter(prefix="/api/deletions", tags=["deletions"])

KIND_LABELS = {
    "order": "订单",
    "shop": "店铺",
    "supplier": "供应商",
}

ROLE_LABELS = {
    ROLE_ADMIN: "管理员",
    ROLE_MANAGER: "店长",
}


class DeletionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    kind: str
    kind_label: str
    summary: str
    operator_id: Optional[int] = None
    operator_username: str = ""
    operator_role: str = ""
    operator_role_label: str = ""
    deleted_at: datetime


def record_deletion(
    db: Database,
    *,
    kind: str,
    summary: str,
    operator: Optional[User] = None,
    detail: Optional[Mapping[str, Any]] = None,
) -> None:
    op_id = None
    op_username = ""
    op_role = ""
    if operator is not None:
        op_id = int(operator.id)
        op_username = operator.username
        op_role = operator.role
    db.deletion_logs.insert_one(
        {
            "_id": next_id(db, "deletion_logs"),
            "kind": kind,
            "summary": summary,
            "detail": dict(detail or {}),
            "operator_id": op_id,
            "operator_username": op_username,
            "operator_role": op_role,
            "deleted_at": utcnow(),
        }
    )


def _serialize_detail_value(value: Any) -> Any:
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return value


def record_order_deletion(db: Database, order, operator: Optional[User] = None) -> None:
    detail = {
        "order_id": order.id,
        "order_no": order.order_no,
        "order_date": _serialize_detail_value(order.order_date),
        "shop_id": getattr(order, "shop_id", None),
        "shop_name": order.shop_name,
        "supplier_id": getattr(order, "supplier_id", None),
        "supplier_name": order.supplier_name,
        "daily_total": order.daily_total,
    }
    summary = (
        f"{order.order_no} · {order.order_date} · "
        f"{order.shop_name} · {order.supplier_name} · ¥{order.daily_total:.2f}"
    )
    record_deletion(
        db, kind="order", summary=summary, detail=detail, operator=operator
    )


def record_shop_deletion(
    db: Database,
    shop_id: int,
    name: str,
    operator: Optional[User] = None,
) -> None:
    record_deletion(
        db,
        kind="shop",
        summary=f"店铺「{name}」",
        detail={"shop_id": shop_id, "name": name},
        operator=operator,
    )


def record_supplier_deletion(
    db: Database,
    supplier_id: int,
    name: str,
    operator: Optional[User] = None,
) -> None:
    record_deletion(
        db,
        kind="supplier",
        summary=f"供应商「{name}」",
        detail={"supplier_id": supplier_id, "name": name},
        operator=operator,
    )


@router.get("", response_model=List[DeletionOut])
def list_deletions(
    limit: int = Query(30, ge=1, le=100, description="返回条数上限"),
    db: Database = Depends(get_db),
    _: User = Depends(require_admin),
):
    cursor = db.deletion_logs.find().sort([("deleted_at", -1), ("_id", -1)]).limit(limit)
    items: List[DeletionOut] = []
    for doc in cursor:
        kind = str(doc.get("kind") or "")
        role = str(doc.get("operator_role") or "")
        raw_op_id = doc.get("operator_id")
        items.append(
            DeletionOut(
                id=int(doc["_id"]),
                kind=kind,
                kind_label=KIND_LABELS.get(kind, kind or "其他"),
                summary=str(doc.get("summary") or ""),
                operator_id=int(raw_op_id) if raw_op_id is not None else None,
                operator_username=str(doc.get("operator_username") or ""),
                operator_role=role,
                operator_role_label=ROLE_LABELS.get(role, role),
                deleted_at=doc["deleted_at"],
            )
        )
    return items


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def clear_deletions(
    db: Database = Depends(get_db),
    _: User = Depends(require_admin),
    __: None = Depends(require_admin_confirm),
):
    db.deletion_logs.delete_many({})
