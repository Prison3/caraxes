from pathlib import Path

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from .auth import get_session_secret, require_user, router as auth_router
from .database import Base, engine
from .routers import router as orders_router
from .seed import seed_catalog
from .shops import router as shops_router
from .suppliers import router as suppliers_router

Base.metadata.create_all(bind=engine)
seed_catalog()

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"

app = FastAPI(
    title="供应商每日订单 API",
    description="Web / Android 上报每日供应商订单数据",
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
    max_age=60 * 60 * 24 * 7,
    same_site="lax",
    https_only=False,
)

_auth = [Depends(require_user)]

app.include_router(auth_router)
app.include_router(orders_router, dependencies=_auth)
app.include_router(shops_router, dependencies=_auth)
app.include_router(suppliers_router, dependencies=_auth)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/")
def index():
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/login")
def login_page():
    return FileResponse(STATIC_DIR / "login.html")


@app.get("/health")
def health():
    return {"status": "ok"}
