from .auth import hash_password
from .database import get_database, next_id
from .models import utcnow

DEFAULT_SHOPS = ("阳光花城", "十字街", "碧水龙城店")
DEFAULT_SUPPLIERS = ("蔬菜",)
DEFAULT_USERNAME = "admin"
DEFAULT_PASSWORD = "admin123"


def seed_catalog() -> None:
    db = get_database()
    now = utcnow()

    if db.shops.count_documents({}) == 0:
        for name in DEFAULT_SHOPS:
            db.shops.insert_one(
                {"_id": next_id(db, "shops"), "name": name, "created_at": now}
            )

    if db.suppliers.count_documents({}) == 0:
        for name in DEFAULT_SUPPLIERS:
            db.suppliers.insert_one(
                {"_id": next_id(db, "suppliers"), "name": name, "created_at": now}
            )

    if db.users.count_documents({"username": DEFAULT_USERNAME}) == 0:
        db.users.insert_one(
            {
                "_id": next_id(db, "users"),
                "username": DEFAULT_USERNAME,
                "password_hash": hash_password(DEFAULT_PASSWORD),
                "created_at": now,
            }
        )
