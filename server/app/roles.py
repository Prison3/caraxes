from __future__ import annotations

from typing import Optional

from fastapi import Depends, HTTPException, status

from .auth import require_user
from .models import ROLE_ADMIN, ROLE_MANAGER, User

__all__ = [
    "ROLE_ADMIN",
    "ROLE_MANAGER",
    "is_admin",
    "is_manager",
    "require_admin",
    "scoped_shop_id",
]


def is_admin(user: User) -> bool:
    return user.role == ROLE_ADMIN


def is_manager(user: User) -> bool:
    return user.role == ROLE_MANAGER


def require_admin(user: User = Depends(require_user)) -> User:
    if not is_admin(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限",
        )
    return user


def scoped_shop_id(user: User) -> Optional[int]:
    """店长返回绑定店铺 ID；管理员返回 None（不限制）。"""
    if is_manager(user):
        if not user.shop_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="店长账号未绑定店铺",
            )
        return int(user.shop_id)
    return None
