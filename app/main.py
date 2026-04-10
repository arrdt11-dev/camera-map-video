from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.cameras import router as cameras_router
from app.api.videos import router as videos_router

app = FastAPI(title="Camera Map Video API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth", tags=["Auth"])
app.include_router(cameras_router, prefix="/cameras", tags=["Cameras"])
app.include_router(videos_router, prefix="/videos", tags=["Videos"])


@app.get("/")
async def root():
    return {"message": "Camera Map Video API работает"}


@app.get("/health")
async def health():
    return {"status": "ok"}