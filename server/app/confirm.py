from __future__ import annotations

import hmac
import os

from fastapi import Header, HTTPException, status

ADMIN_CONFIRM_PASSWORD = os.environ.get("ADMIN_CONFIRM_PASSWORD", "longcudangjia")
ADMIN_CONFIRM_HEADER = "X-Admin-Confirm"


def require_admin_confirm(
    x_admin_confirm: str | None = Header(default=None, alias=ADMIN_CONFIRM_HEADER),
) -> None:
    expected = ADMIN_CONFIRM_PASSWORD
    provided = (x_admin_confirm or "").strip()
    if not provided or not hmac.compare_digest(provided, expected):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="管理密码错误",
        )
