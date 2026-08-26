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


def _ohlc_from_totals(values: List[float]) -> Tuple[float, float, float, float]:
    series = [float(v) for v in values if v > 0]
    if not series:
        return 0.0, 0.0, 0.0, 0.0
    return (
        round(series[0], 2),
        round(max(series), 2),
        round(min(series), 2),
        round(series[-1], 2),
    )


def _order_day_stats(
    db: Database,
    start: date,
    end: date,
    extra_match: Optional[dict] = None,
) -> Dict[str, dict]:
    match = {
        "order_date": {
            "$gte": serialize_order_date(start),
            "$lte": serialize_order_date(end),
        }
    }
    if extra_match:
        match.update(extra_match)
    pipeline = [
        {"$match": match},
        {"$sort": {"order_date": 1, "_id": 1}},
        {
            "$group": {
                "_id": "$order_date",
                "total": {"$sum": "$daily_total"},
                "count": {"$sum": 1},
                "open": {"$first": "$daily_total"},
                "close": {"$last": "$daily_total"},
                "high": {"$max": "$daily_total"},
                "low": {"$min": "$daily_total"},
            }
        },
    ]
    out: Dict[str, dict] = {}
    for row in db.supplier_orders.aggregate(pipeline):
        key = row.get("_id")
        if key is None:
            continue
        out[str(key)[:10]] = {
            "total": round(float(row.get("total") or 0), 2),
            "count": int(row.get("count") or 0),
            "open": round(float(row.get("open") or 0), 2),
            "high": round(float(row.get("high") or 0), 2),
            "low": round(float(row.get("low") or 0), 2),
            "close": round(float(row.get("close") or 0), 2),
        }
    return out


def _empty_stat() -> dict:
    return {"total": 0.0, "count": 0, "open": 0.0, "high": 0.0, "low": 0.0, "close": 0.0}


def _make_bucket(key: str, label: str, stat: dict) -> CostBucket:
    return CostBucket(
        key=key,
        label=label,
        total=round(float(stat.get("total") or 0), 2),
        count=int(stat.get("count") or 0),
        open=round(float(stat.get("open") or 0), 2),
        high=round(float(stat.get("high") or 0), 2),
        low=round(float(stat.get("low") or 0), 2),
        close=round(float(stat.get("close") or 0), 2),
    )


def _day_buckets(
    db: Database,
    month_start: date,
    month_end: date,
    extra_match: Optional[dict] = None,
) -> List[CostBucket]:
    stats = _order_day_stats(db, month_start, month_end, extra_match)
    buckets: List[CostBucket] = []
    day = month_start
    while day <= month_end:
        key = day.isoformat()
        buckets.append(_make_bucket(key, f"{day.day}日", stats.get(key) or _empty_stat()))
        day += timedelta(days=1)
    return buckets


def _year_day_buckets(
    db: Database,
    year: int,
    extra_match: Optional[dict] = None,
) -> List[CostBucket]:
    start, end = _year_bounds(year)
    stats = _order_day_stats(db, start, end, extra_match)
    buckets: List[CostBucket] = []
    day = start
    while day <= end:
        key = day.isoformat()
        buckets.append(
            _make_bucket(key, f"{day.month}月{day.day}日", stats.get(key) or _empty_stat())
        )
        day += timedelta(days=1)
    return buckets


def _month_buckets(
    db: Database,
    year: int,
    extra_match: Optional[dict] = None,
) -> List[CostBucket]:
    start, end = _year_bounds(year)
    stats = _order_day_stats(db, start, end, extra_match)
    buckets: List[CostBucket] = []
    for mon in range(1, 13):
        key = f"{year:04d}-{mon:02d}"
        totals: List[float] = []
        count = 0
        day = date(year, mon, 1)
        last = calendar.monthrange(year, mon)[1]
        while day.day <= last:
            stat = stats.get(day.isoformat())
            if stat:
                totals.append(float(stat["total"]))
                count += int(stat["count"])
            if day.day == last:
                break
            day += timedelta(days=1)
        open_, high, low, close = _ohlc_from_totals(totals)
        buckets.append(
            CostBucket(
                key=key,
                label=f"{mon}月",
                total=round(sum(totals), 2),
                count=count,
                open=open_,
                high=high,
                low=low,
                close=close,
            )
        )
    return buckets


@router.get("", response_model=CostReportOut)
def list_costs(
    group_by: Literal["shop", "supplier"] = Query("shop", description="按店铺或供应商汇总"),
    period: Literal["day", "month"] = Query("month", description="按日或按月查看"),
    order_date: Optional[date] = Query(None, description="按日查看时的日期"),
    month: Optional[str] = Query(None, description="按月查看时的月份，格式 YYYY-MM"),
    year: Optional[int] = Query(None, ge=2000, le=2100, description="按年查看月柱时的年份"),
    chart: Literal["bar", "kline", "calendar"] = Query("bar", description="柱状、K线或日历"),
    shop_id: Optional[int] = Query(None, gt=0, description="按店铺筛选"),
    supplier_id: Optional[int] = Query(None, gt=0, description="按供应商筛选"),
    db: Database = Depends(get_db),
    _: User = Depends(require_admin),
):
    extra_match: dict = {}
    if shop_id is not None:
        extra_match["shop_id"] = shop_id
    if supplier_id is not None:
        extra_match["supplier_id"] = supplier_id

    if period == "day":
        day = order_date or date.today()
        start, end = day, day
        month_start, month_end = _month_bounds(f"{day.year:04d}-{day.month:02d}")
        buckets = _day_buckets(db, month_start, month_end, extra_match)
        selected = day.isoformat()
    elif year is not None:
        month_value = (month or "").strip()
        if month_value and _MONTH_RE.match(month_value) and int(month_value[:4]) == year:
            start, end = _month_bounds(month_value)
            selected = month_value
        else:
            start, end = _year_bounds(year)
            selected = f"{year:04d}"
        if chart == "calendar":
            buckets = _year_day_buckets(db, year, extra_match)
        else:
            buckets = _month_buckets(db, year, extra_match)
    else:
        value = (month or "").strip() or f"{date.today().year:04d}-{date.today().month:02d}"
        if not _MONTH_RE.match(value):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="month 格式应为 YYYY-MM",
            )
        start, end = _month_bounds(value)
        year = int(value[:4])
        if chart == "calendar":
            buckets = _day_buckets(db, start, end, extra_match)
        else:
            buckets = _month_buckets(db, year, extra_match)
        selected = value

    group_field = "shop_id" if group_by == "shop" else "supplier_id"
    catalog = list(
        db.shops.find({}).sort("name", 1)
        if group_by == "shop"
        else db.suppliers.find({}).sort("name", 1)
    )
    if group_by == "shop" and shop_id is not None:
        catalog = [doc for doc in catalog if int(doc["_id"]) == shop_id]
    if group_by == "supplier" and supplier_id is not None:
        catalog = [doc for doc in catalog if int(doc["_id"]) == supplier_id]
    names = {int(doc["_id"]): str(doc.get("name") or "") for doc in catalog}

    match = {
        "order_date": {
            "$gte": serialize_order_date(start),
            "$lte": serialize_order_date(end),
        }
    }
    match.update(extra_match)
    pipeline = [
        {"$match": match},
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
