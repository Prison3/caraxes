from .auth import hash_password
from .database import SessionLocal
from .models import Shop, Supplier, User

DEFAULT_SHOPS = ("阳光花城", "十字街", "碧水龙城店")
DEFAULT_SUPPLIERS = ("蔬菜",)
DEFAULT_USERNAME = "admin"
DEFAULT_PASSWORD = "admin123"


def seed_catalog():
    db = SessionLocal()
    try:
        if db.query(Shop).count() == 0:
            for name in DEFAULT_SHOPS:
                db.add(Shop(name=name))
        if db.query(Supplier).count() == 0:
            for name in DEFAULT_SUPPLIERS:
                db.add(Supplier(name=name))
        if db.query(User).filter(User.username == DEFAULT_USERNAME).count() == 0:
            db.add(
                User(
                    username=DEFAULT_USERNAME,
                    password_hash=hash_password(DEFAULT_PASSWORD),
                )
            )
        db.commit()
    finally:
        db.close()
