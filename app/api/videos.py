import subprocess
from pathlib import Path
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.camera import Camera
from app.models.user import User
from app.models.video import Video
from app.schemas.video import VideoResponse
from app.services.minio_service import MinioService

router = APIRouter(prefix="/videos", tags=["Videos"])

ALLOWED_VIDEO_CONTENT_TYPES = {
    "video/mp4",
    "application/mp4",
    "application/octet-stream",
    "video/octet-stream",
}

TMP_UPLOAD_DIR = Path("/tmp/camera_map_video_uploads")
TMP_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def _build_video_response(video: Video, user: User | None = None) -> dict:
    owner = user if user is not None else getattr(video, "user", None)

    minio_service = MinioService()

    video_url = (
        minio_service.get_public_url(minio_service.bucket_videos, video.storage_key)
        if video.storage_key
        else None
    )
    preview_url = (
        minio_service.get_public_url(minio_service.bucket_previews, video.preview_key)
        if video.preview_key
        else None
    )

    return {
        "id": video.id,
        "user_id": video.user_id,
        "user_full_name": getattr(owner, "full_name", None),
        "user_email": getattr(owner, "email", None),
        "camera_id": video.camera_id,
        "filename": video.filename,
        "storage_key": video.storage_key,
        "preview_key": video.preview_key,
        "video_url": video_url,
        "preview_url": preview_url,
        "latitude": video.latitude,
        "longitude": video.longitude,
        "status": video.status,
        "uploaded_at": video.uploaded_at,
    }


def _validate_video_file(file: UploadFile, file_bytes: bytes) -> None:
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File name is required",
        )

    lower_name = file.filename.lower()

    if not lower_name.endswith(".mp4"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .mp4 files are allowed",
        )

    if file.content_type and file.content_type not in ALLOWED_VIDEO_CONTENT_TYPES:
        pass

    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty",
        )

    if len(file_bytes) < 16:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is too small to be a valid mp4",
        )

    if b"ftyp" not in file_bytes[:64]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is not a valid mp4",
        )


def _extract_first_frame(video_path: Path, preview_path: Path) -> None:
    command = [
        "ffmpeg",
        "-y",
        "-i",
        str(video_path),
        "-frames:v",
        "1",
        str(preview_path),
    ]

    result = subprocess.run(command, capture_output=True, text=True)

    if result.returncode != 0 or not preview_path.exists():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to extract preview frame from video",
        )


@router.post("/upload", response_model=VideoResponse)
async def upload_video(
    camera_id: UUID = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = result.scalar_one_or_none()

    if not camera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camera not found",
        )

    file_bytes = await file.read()
    _validate_video_file(file, file_bytes)

    unique_video_name = f"{uuid4()}_{file.filename}"
    video_object_name = f"{user.id}/{unique_video_name}"

    base_name = file.filename.rsplit(".", 1)[0]
    unique_preview_name = f"{uuid4()}_{base_name}.jpg"
    preview_object_name = f"{user.id}/previews/{unique_preview_name}"

    temp_video_path = TMP_UPLOAD_DIR / unique_video_name
    temp_preview_path = TMP_UPLOAD_DIR / unique_preview_name

    minio_service = MinioService()

    try:
        temp_video_path.write_bytes(file_bytes)
        _extract_first_frame(temp_video_path, temp_preview_path)

        preview_bytes = temp_preview_path.read_bytes()

        minio_service.upload_bytes(
            bucket_name=minio_service.bucket_videos,
            object_name=video_object_name,
            data=file_bytes,
            content_type="video/mp4",
        )

        minio_service.upload_bytes(
            bucket_name=minio_service.bucket_previews,
            object_name=preview_object_name,
            data=preview_bytes,
            content_type="image/jpeg",
        )
    finally:
        if temp_video_path.exists():
            temp_video_path.unlink(missing_ok=True)
        if temp_preview_path.exists():
            temp_preview_path.unlink(missing_ok=True)

    video = Video(
        user_id=user.id,
        camera_id=camera.id,
        filename=file.filename,
        storage_key=video_object_name,
        preview_key=preview_object_name,
        latitude=getattr(camera, "camera_latitude", None),
        longitude=getattr(camera, "camera_longitude", None),
        status="uploaded",
    )

    db.add(video)
    await db.commit()
    await db.refresh(video)

    return _build_video_response(video, user=user)


@router.get("/", response_model=list[VideoResponse])
async def list_videos(
    camera_id: UUID | None = None,
    title: str | None = None,
    user_id: UUID | None = None,
    user_query: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Video, User)
        .join(User, Video.user_id == User.id)
        .order_by(Video.uploaded_at.desc())
    )

    if camera_id:
        query = query.where(Video.camera_id == camera_id)

    if title:
        query = query.where(Video.filename.ilike(f"%{title}%"))

    if user_id:
        query = query.where(Video.user_id == user_id)

    if user_query:
        pattern = f"%{user_query}%"
        query = query.where(
            or_(
                User.full_name.ilike(pattern),
                User.email.ilike(pattern),
            )
        )

    result = await db.execute(query)
    rows = result.all()

    return [_build_video_response(video, user=user) for video, user in rows]


@router.delete("/{video_id}")
async def delete_video(
    video_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(Video).where(Video.id == video_id))
    video = result.scalar_one_or_none()

    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )

    if video.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can delete only your own videos",
        )

    minio_service = MinioService()

    if video.storage_key:
        minio_service.delete_object(
            bucket_name=minio_service.bucket_videos,
            object_name=video.storage_key,
        )

    if video.preview_key:
        minio_service.delete_object(
            bucket_name=minio_service.bucket_previews,
            object_name=video.preview_key,
        )

    await db.delete(video)
    await db.commit()

    return {"message": "Video deleted successfully"}


@router.get("/my/dashboard")
async def my_dashboard(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Video)
        .where(Video.user_id == user.id)
        .order_by(Video.uploaded_at.desc())
    )
    videos = result.scalars().all()

    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "organization": user.organization,
            "is_active": user.is_active,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
        },
        "videos": [_build_video_response(video, user=user) for video in videos],
        "videos_count": len(videos),
    }