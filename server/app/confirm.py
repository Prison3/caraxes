from __future__ import annotations

from fastapi import Depends, Header, HTTPException, status

from .auth import require_user, verify_password
from .models import User

ADMIN_CONFIRM_HEADER = "X-Admin-Confirm"


def require_admin_confirm(
    user: User = Depends(require_user),
    x_admin_confirm: str | None = Header(default=None, alias=ADMIN_CONFIRM_HEADER),
) -> User:
    """删除操作需再次输入当前账号的登录密码确认。"""
    provided = (x_admin_confirm or "").strip()
    if not provided or not verify_password(provided, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="登录密码错误",
        )
    return user
