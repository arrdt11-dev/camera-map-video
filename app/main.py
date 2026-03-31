from fastapi import FastAPI

from app.api.auth import router as auth_router
from app.api.cameras import router as cameras_router
from app.api.videos import router as videos_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Camera Map Video Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


app.include_router(auth_router)
app.include_router(cameras_router)
app.include_router(videos_router)