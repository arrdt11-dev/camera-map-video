import io
import subprocess
import tempfile
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from minio.error import S3Error
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.camera import Camera
from app.models.user import User
from app.models.video import Video
from app.services.minio_service import MinioService

router = APIRouter()


def _ensure_mp4_file(upload_file: UploadFile) -> None:
    filename = (upload_file.filename or "").lower()
    content_type = (upload_file.content_type or "").lower()

    if not filename.endswith(".mp4") and content_type not in {
        "video/mp4",
        "application/mp4",
    }:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Разрешена загрузка только mp4 файлов",
        )


def _probe_video_file(file_path: str) -> None:
    """
    Проверяем, что файл реально читается как видео.
    """
    result = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "stream=codec_name",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            file_path,
        ],
        capture_output=True,
        text=True,
    )

    if result.returncode != 0 or not result.stdout.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Файл не читается как корректное видео",
        )


def _extract_first_frame(file_path: str) -> bytes:
    """
    Сохраняем первый кадр в jpg для preview.
    """
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as preview_tmp:
        preview_path = preview_tmp.name

    try:
        result = subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-i",
                file_path,
                "-frames:v",
                "1",
                preview_path,
            ],
            capture_output=True,
            text=True,
        )

        if result.returncode != 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Не удалось извлечь первый кадр из видео",
            )

        preview_bytes = Path(preview_path).read_bytes()
        if not preview_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Первый кадр пустой или не был создан",
            )

        return preview_bytes
    finally:
        Path(preview_path).unlink(missing_ok=True)


@router.get("/")
async def list_videos(
    title: str | None = Query(default=None),
    user: str | None = Query(default=None),
    camera_id: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Video, User)
        .join(User, Video.user_id == User.id)
        .order_by(Video.uploaded_at.desc())
    )

    result = await db.execute(stmt)
    rows = result.all()

    minio_service = MinioService()
    response = []

    for video, user_obj in rows:
        item = {
            "id": str(video.id),
            "user_id": str(video.user_id),
            "user_full_name": user_obj.full_name,
            "user_email": user_obj.email,
            "camera_id": str(video.camera_id) if video.camera_id else None,
            "filename": video.filename,
            "storage_key": video.storage_key,
            "preview_key": video.preview_key,
            "video_url": (
                minio_service.get_public_url(
                    minio_service.bucket_videos,
                    video.storage_key,
                )
                if video.storage_key
                else None
            ),
            "preview_url": (
                minio_service.get_public_url(
                    minio_service.bucket_previews,
                    video.preview_key,
                )
                if video.preview_key
                else None
            ),
            "latitude": video.latitude,
            "longitude": video.longitude,
            "status": video.status,
            "uploaded_at": video.uploaded_at,
        }

        response.append(item)

    if title:
        title_lower = title.lower()
        response = [
            item for item in response
            if (item["filename"] or "").lower().find(title_lower) != -1
        ]

    if user:
        user_lower = user.lower()
        response = [
            item for item in response
            if (
                (item["user_full_name"] or "").lower().find(user_lower) != -1
                or (item["user_email"] or "").lower().find(user_lower) != -1
                or (item["user_id"] or "").lower().find(user_lower) != -1
            )
        ]

    if camera_id:
        response = [item for item in response if item["camera_id"] == camera_id]

    return response


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_video(
    camera_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _ensure_mp4_file(file)

    camera_result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = camera_result.scalar_one_or_none()

    if not camera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Камера не найдена",
        )

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Файл пустой",
        )

    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        _probe_video_file(tmp_path)
        preview_bytes = _extract_first_frame(tmp_path)

        safe_filename = Path(file.filename or "video.mp4").name
        video_ext = Path(safe_filename).suffix or ".mp4"

        video_object_name = f"{current_user.id}/{uuid.uuid4()}{video_ext}"
        preview_object_name = f"{current_user.id}/{uuid.uuid4()}.jpg"

        minio_service = MinioService()

        minio_service.client.put_object(
            minio_service.bucket_videos,
            video_object_name,
            io.BytesIO(file_bytes),
            length=len(file_bytes),
            content_type="video/mp4",
        )

        minio_service.client.put_object(
            minio_service.bucket_previews,
            preview_object_name,
            io.BytesIO(preview_bytes),
            length=len(preview_bytes),
            content_type="image/jpeg",
        )

        video = Video(
            user_id=current_user.id,
            camera_id=camera.id,
            filename=safe_filename,
            storage_key=video_object_name,
            preview_key=preview_object_name,
            latitude=camera.camera_latitude,
            longitude=camera.camera_longitude,
            status="uploaded",
            uploaded_at=datetime.now(timezone.utc),
        )

        db.add(video)
        await db.commit()
        await db.refresh(video)

        return {
            "id": str(video.id),
            "user_id": str(video.user_id),
            "camera_id": str(video.camera_id) if video.camera_id else None,
            "filename": video.filename,
            "storage_key": video.storage_key,
            "preview_key": video.preview_key,
            "status": video.status,
            "uploaded_at": video.uploaded_at,
        }

    finally:
        Path(tmp_path).unlink(missing_ok=True)


@router.delete("/{video_id}")
async def delete_video(
    video_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Video).where(Video.id == video_id))
    video = result.scalar_one_or_none()

    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Видео не найдено",
        )

    minio_service = MinioService()

    if video.storage_key:
        try:
            minio_service.client.remove_object(
                minio_service.bucket_videos,
                video.storage_key,
            )
        except S3Error:
            pass

    if video.preview_key:
        try:
            minio_service.client.remove_object(
                minio_service.bucket_previews,
                video.preview_key,
            )
        except S3Error:
            pass

    await db.execute(delete(Video).where(Video.id == video.id))
    await db.commit()

    return {"detail": "Видео удалено"}