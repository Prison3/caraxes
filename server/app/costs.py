from __future__ import annotations

import calendar
import re
from datetime import date, timedelta
from typing import Dict, List, Literal, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pymongo.database import Database

from .database import get_db
from .models import User, serialize_order_date
from .roles import require_admin
from .schemas import CostBucket, CostItem, CostReportOut

router = APIRouter(prefix="/api/costs", tags=["costs"])

_MONTH_RE = re.compile(r"^\d{4}-(0[1-9]|1[0-2])$")


def _month_bounds(month: str) -> Tuple[date, date]:
    year, mon = map(int, month.split("-"))
    start = date(year, mon, 1)
    end = date(year, mon, calendar.monthrange(year, mon)[1])
    return start, end


def _year_bounds(year: int) -> Tuple[date, date]:
    return date(year, 1, 1), date(year, 12, 31)


def _sum_by_key(db: Database, start: date, end: date, group_expr) -> Dict[str, Tuple[float, int]]:
    pipeline = [
        {
            "$match": {
                "order_date": {
                    "$gte": serialize_order_date(start),
                    "$lte": serialize_order_date(end),
                }
            }
        },
        {
            "$group": {
                "_id": group_expr,
                "total": {"$sum": "$daily_total"},
                "count": {"$sum": 1},
            }
        },
    ]
    out: Dict[str, Tuple[float, int]] = {}
    for row in db.supplier_orders.aggregate(pipeline):
        key = row.get("_id")
        if key is None:
            continue
        out[str(key)[:10] if group_expr == "$order_date" else str(key)[:7]] = (
            float(row.get("total") or 0),
            int(row.get("count") or 0),
        )
    return out


def _day_buckets(db: Database, month_start: date, month_end: date) -> List[CostBucket]:
    totals = _sum_by_key(db, month_start, month_end, "$order_date")
    buckets: List[CostBucket] = []
    day = month_start
    while day <= month_end:
        key = day.isoformat()
        amount, count = totals.get(key, (0.0, 0))
        buckets.append(
            CostBucket(
                key=key,
                label=f"{day.day}日",
                total=round(amount, 2),
                count=count,
            )
        )
        day += timedelta(days=1)
    return buckets


def _month_buckets(db: Database, year: int) -> List[CostBucket]:
    start, end = _year_bounds(year)
    totals = _sum_by_key(db, start, end, {"$substrCP": ["$order_date", 0, 7]})
    buckets: List[CostBucket] = []
    for mon in range(1, 13):
        key = f"{year:04d}-{mon:02d}"
        amount, count = totals.get(key, (0.0, 0))
        buckets.append(
            CostBucket(
                key=key,
                label=f"{mon}月",
                total=round(amount, 2),
                count=count,
            )
        )
    return buckets


@router.get("", response_model=CostReportOut)
def list_costs(
    group_by: Literal["shop", "supplier"] = Query("shop", description="按店铺或供应商汇总"),
    period: Literal["day", "month"] = Query("month", description="按日或按月查看"),
    order_date: Optional[date] = Query(None, description="按日查看时的日期"),
    month: Optional[str] = Query(None, description="按月查看时的月份，格式 YYYY-MM"),
    db: Database = Depends(get_db),
    _: User = Depends(require_admin),
):
    if period == "day":
        day = order_date or date.today()
        start, end = day, day
        month_start, month_end = _month_bounds(f"{day.year:04d}-{day.month:02d}")
        buckets = _day_buckets(db, month_start, month_end)
        selected = day.isoformat()
    else:
        value = (month or "").strip() or f"{date.today().year:04d}-{date.today().month:02d}"
        if not _MONTH_RE.match(value):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="month 格式应为 YYYY-MM",
            )
        start, end = _month_bounds(value)
        year = int(value[:4])
        buckets = _month_buckets(db, year)
        selected = value

    group_field = "shop_id" if group_by == "shop" else "supplier_id"
    catalog = list(
        db.shops.find({}).sort("name", 1)
        if group_by == "shop"
        else db.suppliers.find({}).sort("name", 1)
    )
    names = {int(doc["_id"]): str(doc.get("name") or "") for doc in catalog}

    pipeline = [
        {
            "$match": {
                "order_date": {
                    "$gte": serialize_order_date(start),
                    "$lte": serialize_order_date(end),
                }
            }
        },
        {
            "$group": {
                "_id": f"${group_field}",
                "total": {"$sum": "$daily_total"},
                "count": {"$sum": 1},
            }
        },
    ]
    totals = {}
    counts = {}
    grand_total = 0.0
    grand_count = 0
    for row in db.supplier_orders.aggregate(pipeline):
        if row.get("_id") is None:
            continue
        key = int(row["_id"])
        amount = float(row.get("total") or 0)
        n = int(row.get("count") or 0)
        totals[key] = amount
        counts[key] = n
        grand_total += amount
        grand_count += n

    items: List[CostItem] = []
    seen = set()
    for doc in catalog:
        item_id = int(doc["_id"])
        seen.add(item_id)
        items.append(
            CostItem(
                id=item_id,
                name=str(doc.get("name") or ""),
                total=round(totals.get(item_id, 0.0), 2),
                count=counts.get(item_id, 0),
            )
        )
    for item_id, amount in totals.items():
        if item_id in seen:
            continue
        items.append(
            CostItem(
                id=item_id,
                name=names.get(item_id) or f"已删除 #{item_id}",
                total=round(amount, 2),
                count=counts.get(item_id, 0),
            )
        )
    items.sort(key=lambda x: (-x.total, x.name))
    return CostReportOut(
        group_by=group_by,
        period=period,
        date_from=start,
        date_to=end,
        total=round(grand_total, 2),
        count=grand_count,
        selected=selected,
        items=items,
        buckets=buckets,
    )
