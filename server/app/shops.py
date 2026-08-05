from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .database import get_db
from .models import Shop
from .schemas import NameCreate, ShopOut

router = APIRouter(prefix="/api/shops", tags=["shops"])


@router.get("", response_model=List[ShopOut])
def list_shops(db: Session = Depends(get_db)):
    return db.query(Shop).order_by(Shop.id.asc()).all()


@router.post("", response_model=ShopOut, status_code=status.HTTP_201_CREATED)
def create_shop(payload: NameCreate, db: Session = Depends(get_db)):
    shop = Shop(name=payload.name.strip())
    if not shop.name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="店铺名不能为空")
    db.add(shop)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="该店铺已存在",
        )
    db.refresh(shop)
    return shop


@router.delete("/{shop_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shop(shop_id: int, db: Session = Depends(get_db)):
    shop = db.get(Shop, shop_id)
    if shop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="店铺不存在")
    db.delete(shop)
    db.commit()
