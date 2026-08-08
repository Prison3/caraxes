from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError

from .confirm import require_admin_confirm
from .database import get_db, next_id
from .models import Shop, utcnow
from .names import normalize_name
from .schemas import NameCreate, ShopOut

router = APIRouter(prefix="/api/shops", tags=["shops"])


@router.get("", response_model=List[ShopOut])
def list_shops(db: Database = Depends(get_db)):
    return [Shop.from_doc(doc) for doc in db.shops.find().sort("_id", 1)]


@router.post("", response_model=ShopOut, status_code=status.HTTP_201_CREATED)
def create_shop(payload: NameCreate, db: Database = Depends(get_db)):
    name = " ".join(payload.name.strip().split())
    if not name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="店铺名不能为空")
    name_key = normalize_name(name)
    if db.shops.find_one({"$or": [{"name": name}, {"name_key": name_key}]}):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="店铺名不可以重复",
        )
    doc = {
        "_id": next_id(db, "shops"),
        "name": name,
        "name_key": name_key,
        "created_at": utcnow(),
    }
    try:
        db.shops.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="店铺名不可以重复",
        )
    return Shop.from_doc(doc)


@router.delete("/{shop_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shop(
    shop_id: int,
    db: Database = Depends(get_db),
    _: None = Depends(require_admin_confirm),
):
    result = db.shops.delete_one({"_id": shop_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="店铺不存在")
