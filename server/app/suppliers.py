from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError

from .database import get_db, next_id
from .models import Supplier, utcnow
from .schemas import NameCreate, SupplierOut

router = APIRouter(prefix="/api/suppliers", tags=["suppliers"])


@router.get("", response_model=List[SupplierOut])
def list_suppliers(db: Database = Depends(get_db)):
    return [Supplier.from_doc(doc) for doc in db.suppliers.find().sort("_id", 1)]


@router.post("", response_model=SupplierOut, status_code=status.HTTP_201_CREATED)
def create_supplier(payload: NameCreate, db: Database = Depends(get_db)):
    name = payload.name.strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="供应商名不能为空"
        )
    doc = {"_id": next_id(db, "suppliers"), "name": name, "created_at": utcnow()}
    try:
        db.suppliers.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="该供应商已存在",
        )
    return Supplier.from_doc(doc)


@router.delete("/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(supplier_id: int, db: Database = Depends(get_db)):
    result = db.suppliers.delete_one({"_id": supplier_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="供应商不存在")
