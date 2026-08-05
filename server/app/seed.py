from .database import SessionLocal
from .models import Shop, Supplier

DEFAULT_SHOPS = ("阳光花城", "十字街", "碧水龙城店")
DEFAULT_SUPPLIERS = ("蔬菜",)


def seed_catalog():
    db = SessionLocal()
    try:
        if db.query(Shop).count() == 0:
            for name in DEFAULT_SHOPS:
                db.add(Shop(name=name))
        if db.query(Supplier).count() == 0:
            for name in DEFAULT_SUPPLIERS:
                db.add(Supplier(name=name))
        db.commit()
    finally:
        db.close()
