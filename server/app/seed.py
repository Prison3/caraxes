from .auth import hash_password
from .database import get_database, next_id
from .models import ROLE_ADMIN, ROLE_MANAGER, utcnow
from .names import normalize_name

DEFAULT_SHOPS = ("阳光花城", "十字街", "碧水龙城店")
DEFAULT_SUPPLIERS = ("蔬菜",)
DEFAULT_USERNAME = "admin"
DEFAULT_PASSWORD = "admin123"
DEFAULT_BOSS_USERNAME = "boss"
DEFAULT_BOSS_PASSWORD = "mei123"
DEFAULT_MANAGER_PASSWORD = "12345"


def create_default_manager_for_shop(db, *, shop_id: int, shop_name: str, now=None) -> bool:
    """为店铺创建默认店长（用户名=店铺名，密码见 DEFAULT_MANAGER_PASSWORD）。

    已有店长则跳过并返回 False；用户名被占用则抛出 ValueError。
    """
    shop_id = int(shop_id)
    if db.users.find_one({"role": ROLE_MANAGER, "shop_id": shop_id}):
        return False
    if db.users.find_one({"username": shop_name}):
        raise ValueError(f"无法自动创建店长：用户名「{shop_name}」已存在")
    db.users.insert_one(
        {
            "_id": next_id(db, "users"),
            "username": shop_name,
            "password_hash": hash_password(DEFAULT_MANAGER_PASSWORD),
            "role": ROLE_MANAGER,
            "shop_id": shop_id,
            "shop_name": shop_name,
            "disabled": False,
            "created_at": now or utcnow(),
        }
    )
    return True


def _ensure_admin_roles(db) -> None:
    db.users.update_many(
        {"role": {"$exists": False}},
        {"$set": {"role": ROLE_ADMIN, "shop_id": None, "shop_name": None}},
    )
    db.users.update_many(
        {"role": ROLE_ADMIN},
        {"$set": {"shop_id": None}},
    )
    db.users.update_many(
        {"disabled": {"$exists": False}},
        {"$set": {"disabled": False}},
    )


def _seed_managers_for_shops(db, now) -> None:
    """为尚无店长的店铺创建默认店长账号（用户名=店铺名，密码见 DEFAULT_MANAGER_PASSWORD）。"""
    for shop in db.shops.find().sort("_id", 1):
        try:
            create_default_manager_for_shop(
                db,
                shop_id=int(shop["_id"]),
                shop_name=shop["name"],
                now=now,
            )
        except ValueError:
            continue


def seed_catalog() -> None:
    db = get_database()
    now = utcnow()

    if db.shops.count_documents({}) == 0:
        for name in DEFAULT_SHOPS:
            db.shops.insert_one(
                {
                    "_id": next_id(db, "shops"),
                    "name": name,
                    "name_key": normalize_name(name),
                    "created_at": now,
                }
            )

    if db.suppliers.count_documents({}) == 0:
        for name in DEFAULT_SUPPLIERS:
            db.suppliers.insert_one(
                {
                    "_id": next_id(db, "suppliers"),
                    "name": name,
                    "name_key": normalize_name(name),
                    "created_at": now,
                }
            )

    if db.users.count_documents({"username": DEFAULT_USERNAME}) == 0:
        db.users.insert_one(
            {
                "_id": next_id(db, "users"),
                "username": DEFAULT_USERNAME,
                "password_hash": hash_password(DEFAULT_PASSWORD),
                "role": ROLE_ADMIN,
                "shop_id": None,
                "shop_name": None,
                "disabled": False,
                "created_at": now,
            }
        )

    if db.users.count_documents({"username": DEFAULT_BOSS_USERNAME}) == 0:
        db.users.insert_one(
            {
                "_id": next_id(db, "users"),
                "username": DEFAULT_BOSS_USERNAME,
                "password_hash": hash_password(DEFAULT_BOSS_PASSWORD),
                "role": ROLE_ADMIN,
                "shop_id": None,
                "shop_name": None,
                "disabled": False,
                "created_at": now,
            }
        )

    _ensure_admin_roles(db)
    _seed_managers_for_shops(db, now)
