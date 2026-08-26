from __future__ import annotations

from fastapi import APIRouter, Depends
from pymongo.database import Database

from .database import get_db
from .models import User, utcnow
from .roles import require_admin
from .auth import require_user
from .schemas import SettingsOut, SettingsUpdate

SETTINGS_ID = "app"

router = APIRouter(prefix="/api/settings", tags=["settings"])


def read_settings(db: Database) -> SettingsOut:
    doc = db.settings.find_one({"_id": SETTINGS_ID}) or {}
    return SettingsOut(pause_web=bool(doc.get("pause_web", False)))


@router.get("", response_model=SettingsOut)
def get_settings(
    db: Database = Depends(get_db),
    _: User = Depends(require_user),
):
    return read_settings(db)


@router.put("", response_model=SettingsOut)
def update_settings(
    payload: SettingsUpdate,
    db: Database = Depends(get_db),
    _: User = Depends(require_admin),
):
    db.settings.update_one(
        {"_id": SETTINGS_ID},
        {
            "$set": {
                "pause_web": bool(payload.pause_web),
                "updated_at": utcnow(),
            }
        },
        upsert=True,
    )
    return read_settings(db)
