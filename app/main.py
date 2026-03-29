from fastapi import FastAPI

from app.api.auth import router as auth_router
from app.core.config import settings


app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
)


@app.get("/")
async def root():
    return {"message": "Camera Map Video Service is running"}


@app.get("/health")
async def health():
    return {"status": "ok"}


app.include_router(auth_router)