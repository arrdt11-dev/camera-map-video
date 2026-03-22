from fastapi import FastAPI
from sqlalchemy import text

from app.api.auth import router as auth_router
from app.db.session import engine
from app.api.videos import router as videos_router

app = FastAPI(title="Camera Map Video Service")

app.include_router(auth_router, prefix="/api/v1")
app.include_router(videos_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"status": "ok"}


@app.get("/health/db")
async def db_health():
    async with engine.begin() as conn:
        await conn.execute(text("SELECT 1"))
    return {"database": "ok"}