from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError

from .database import get_db, next_id
from .models import Shop, utcnow
from .schemas import NameCreate, ShopOut

router = APIRouter(prefix="/api/shops", tags=["shops"])


@router.get("", response_model=List[ShopOut])
def list_shops(db: Database = Depends(get_db)):
    return [Shop.from_doc(doc) for doc in db.shops.find().sort("_id", 1)]


@router.post("", response_model=ShopOut, status_code=status.HTTP_201_CREATED)
def create_shop(payload: NameCreate, db: Database = Depends(get_db)):
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="店铺名不能为空")
    doc = {"_id": next_id(db, "shops"), "name": name, "created_at": utcnow()}
    try:
        db.shops.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="该店铺已存在",
        )
    return Shop.from_doc(doc)


@router.delete("/{shop_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shop(shop_id: int, db: Database = Depends(get_db)):
    result = db.shops.delete_one({"_id": shop_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="店铺不存在")
