import os
import subprocess
import tempfile
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.camera import Camera
from app.models.user import User
from app.models.video import Video
from app.schemas.video import VideoResponse
from app.services.minio_service import minio_service

router = APIRouter(prefix="/videos", tags=["Videos"])


def build_video_url(storage_key: str) -> str:
    return f"{settings.MINIO_PUBLIC_ENDPOINT}/{minio_service.videos_bucket}/{storage_key}"


def build_preview_url(preview_key: str | None) -> str | None:
    if not preview_key:
        return None
    return f"{settings.MINIO_PUBLIC_ENDPOINT}/{minio_service.previews_bucket}/{preview_key}"


def to_video_response(video: Video) -> VideoResponse:
    return VideoResponse(
        id=video.id,
        user_id=video.user_id,
        camera_id=video.camera_id,
        filename=video.filename,
        storage_key=video.storage_key,
        preview_key=video.preview_key,
        video_url=build_video_url(video.storage_key),
        preview_url=build_preview_url(video.preview_key),
        latitude=video.latitude,
        longitude=video.longitude,
        status=video.status,
        uploaded_at=video.uploaded_at,
    )


def validate_mp4_filename(filename: str) -> None:
    if not filename.lower().endswith(".mp4"):
        raise HTTPException(status_code=400, detail="Only mp4 files are allowed")


def extract_first_frame(video_path: str, preview_path: str) -> None:
    result = subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i",
            video_path,
            "-frames:v",
            "1",
            preview_path,
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0 or not os.path.exists(preview_path):
        raise HTTPException(status_code=400, detail="Could not read video file")


@router.post("/upload", response_model=VideoResponse)
async def upload_video(
    camera_id: UUID = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    validate_mp4_filename(file.filename or "")

    camera = await db.get(Camera, camera_id)
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")

    with tempfile.TemporaryDirectory() as tmp_dir:
        video_path = os.path.join(tmp_dir, file.filename)
        preview_path = os.path.join(tmp_dir, f"{Path(file.filename).stem}.jpg")

        with open(video_path, "wb") as f:
            f.write(content)

        extract_first_frame(video_path, preview_path)

        with open(preview_path, "rb") as f:
            preview_bytes = f.read()

    minio_service.ensure_buckets()

    storage_key = f"{current_user.id}/{file.filename}"
    preview_key = f"{current_user.id}/previews/{Path(file.filename).stem}.jpg"

    minio_service.upload_bytes(
        bucket_name=minio_service.videos_bucket,
        object_name=storage_key,
        data=content,
        content_type="video/mp4",
    )
    minio_service.upload_bytes(
        bucket_name=minio_service.previews_bucket,
        object_name=preview_key,
        data=preview_bytes,
        content_type="image/jpeg",
    )

    video = Video(
        user_id=current_user.id,
        camera_id=camera.id,
        filename=file.filename,
        storage_key=storage_key,
        preview_key=preview_key,
        latitude=camera.camera_latitude,
        longitude=camera.camera_longitude,
        status="uploaded",
    )

    db.add(video)
    await db.commit()
    await db.refresh(video)

    return to_video_response(video)


@router.get("/", response_model=list[VideoResponse])
async def list_videos(
    camera_id: UUID | None = None,
    title: str | None = None,
    user_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
):
    query: Select[tuple[Video]] = select(Video)

    if camera_id:
        query = query.where(Video.camera_id == camera_id)

    if title:
        query = query.where(Video.filename.ilike(f"%{title}%"))

    if user_id:
        query = query.where(Video.user_id == user_id)

    query = query.order_by(Video.uploaded_at.desc())

    result = await db.execute(query)
    videos = result.scalars().all()

    return [to_video_response(video) for video in videos]


@router.delete("/{video_id}")
async def delete_video(
    video_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    video = await db.get(Video, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    await db.delete(video)
    await db.commit()

    return {"ok": True}


@router.get("/my/dashboard")
async def my_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Video)
        .where(Video.user_id == current_user.id)
        .order_by(Video.uploaded_at.desc())
        .limit(10)
    )

    videos = result.scalars().all()

    return {
        "user": {
            "id": str(current_user.id),
            "email": current_user.email,
            "full_name": current_user.full_name,
            "organization": current_user.organization,
            "is_active": current_user.is_active,
        },
        "last_uploaded_videos": [to_video_response(video) for video in videos],
    }