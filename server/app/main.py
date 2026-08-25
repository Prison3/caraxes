from pathlib import Path

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from .app_release import router as app_release_router
from .auth import get_session_secret, require_user, router as auth_router
from .costs import router as costs_router
from .database import ensure_indexes
from .deletions import router as deletions_router
from .routers import router as orders_router
from .seed import seed_catalog
from .shops import router as shops_router
from .suppliers import router as suppliers_router
from .users import router as users_router

ensure_indexes()
seed_catalog()

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"

app = FastAPI(
    title="供应商管理系统 API",
    description="供应商管理系统：Web / Android 上报每日供应商订单数据",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(
    SessionMiddleware,
    secret_key=get_session_secret(),
    session_cookie="caraxes_session",
    max_age=45 * 60,
    same_site="lax",
    https_only=False,
)

_auth = [Depends(require_user)]

app.include_router(auth_router)
app.include_router(app_release_router)
app.include_router(orders_router, dependencies=_auth)
app.include_router(shops_router, dependencies=_auth)
app.include_router(suppliers_router, dependencies=_auth)
app.include_router(costs_router, dependencies=_auth)
app.include_router(deletions_router, dependencies=_auth)
app.include_router(users_router, dependencies=_auth)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


def _html_response(name: str) -> FileResponse:
    return FileResponse(
        STATIC_DIR / name,
        headers={
            "Cache-Control": "no-store, no-cache, must-revalidate",
            "Pragma": "no-cache",
        },
    )


@app.get("/")
def index():
    return _html_response("index.html")


@app.get("/login")
def login_page():
    return _html_response("login.html")


@app.get("/health")
def health():
    return {"status": "ok"}
