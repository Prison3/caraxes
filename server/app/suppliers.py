from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.database import Database
from pymongo.errors import DuplicateKeyError

from .confirm import require_admin_confirm
from .database import get_db, next_id
from .deletions import record_supplier_deletion
from .models import Supplier, User, utcnow
from .names import normalize_name
from .roles import require_admin
from .schemas import NameCreate, SupplierOut

router = APIRouter(prefix="/api/suppliers", tags=["suppliers"])


@router.get("", response_model=List[SupplierOut])
def list_suppliers(db: Database = Depends(get_db)):
    return [Supplier.from_doc(doc) for doc in db.suppliers.find().sort("_id", 1)]


@router.post("", response_model=SupplierOut, status_code=status.HTTP_201_CREATED)
def create_supplier(
    payload: NameCreate,
    db: Database = Depends(get_db),
    _: User = Depends(require_admin),
):
    name = " ".join(payload.name.strip().split())
    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="供应商名不能为空"
        )
    name_key = normalize_name(name)
    if db.suppliers.find_one({"$or": [{"name": name}, {"name_key": name_key}]}):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="供应商名不可以重复",
        )
    doc = {
        "_id": next_id(db, "suppliers"),
        "name": name,
        "name_key": name_key,
        "created_at": utcnow(),
    }
    try:
        db.suppliers.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="供应商名不可以重复",
        )
    return Supplier.from_doc(doc)


@router.delete("/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(
    supplier_id: int,
    db: Database = Depends(get_db),
    _: User = Depends(require_admin),
    __: None = Depends(require_admin_confirm),
):
    doc = db.suppliers.find_one({"_id": supplier_id})
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="供应商不存在")
    record_supplier_deletion(db, supplier_id, doc["name"])
    db.suppliers.delete_one({"_id": supplier_id})
