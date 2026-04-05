from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from redis.asyncio import Redis
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.redis import get_redis
from app.db.session import get_db
from app.models.camera import Camera
from app.models.user import User
from app.models.video import Video
from app.schemas.camera import CameraCreate, CameraResponse
from app.services.camera_cache import (
    get_cached_geojson,
    invalidate_geojson_cache,
    set_cached_geojson,
)
from app.services.minio_service import MinioService

router = APIRouter(prefix="/cameras", tags=["Cameras"])


@router.post("/", response_model=CameraResponse)
async def create_camera(
    payload: CameraCreate,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    camera = Camera(**payload.model_dump())
    db.add(camera)
    await db.commit()
    await db.refresh(camera)

    await invalidate_geojson_cache(redis)

    return {
        "id": camera.id,
        "camera_id": camera.camera_id,
        "camera_class_cd": camera.camera_class_cd,
        "camera_class": camera.camera_class,
        "model": camera.model,
        "camera_name": camera.camera_name,
        "camera_place": camera.camera_place,
        "camera_place_cd": camera.camera_place_cd,
        "serial_number": camera.serial_number,
        "camera_type_cd": camera.camera_type_cd,
        "camera_type": camera.camera_type,
        "camera_latitude": camera.camera_latitude,
        "camera_longitude": camera.camera_longitude,
        "archive": camera.archive,
        "azimuth": camera.azimuth,
        "process_dttm": camera.process_dttm,
        "created_at": camera.created_at,
        "updated_at": camera.updated_at,
        "videos_count": 0,
        "has_video": False,
    }


@router.get("/", response_model=list[CameraResponse])
async def list_cameras(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: str | None = Query(None),
    model: str | None = Query(None),
    camera_type: str | None = Query(None),
    camera_class: str | None = Query(None),
    videos_from: int | None = Query(None, ge=0),
    videos_to: int | None = Query(None, ge=0),
    has_video: bool | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Camera, func.count(Video.id).label("videos_count"))
        .outerjoin(Video, Video.camera_id == Camera.id)
        .group_by(Camera.id)
    )

    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(
            or_(
                Camera.camera_name.ilike(pattern),
                Camera.camera_id.ilike(pattern),
                Camera.camera_place.ilike(pattern),
            )
        )

    if model:
        stmt = stmt.where(Camera.model.ilike(f"%{model}%"))

    if camera_type:
        stmt = stmt.where(Camera.camera_type.ilike(f"%{camera_type}%"))

    if camera_class:
        stmt = stmt.where(Camera.camera_class.ilike(f"%{camera_class}%"))

    if videos_from is not None:
        stmt = stmt.having(func.count(Video.id) >= videos_from)

    if videos_to is not None:
        stmt = stmt.having(func.count(Video.id) <= videos_to)

    if has_video is True:
        stmt = stmt.having(func.count(Video.id) > 0)

    if has_video is False:
        stmt = stmt.having(func.count(Video.id) == 0)

    stmt = stmt.offset(skip).limit(limit)

    result = await db.execute(stmt)
    rows = result.all()

    response = []
    for camera, videos_count in rows:
        response.append(
            {
                "id": camera.id,
                "camera_id": camera.camera_id,
                "camera_class_cd": camera.camera_class_cd,
                "camera_class": camera.camera_class,
                "model": camera.model,
                "camera_name": camera.camera_name,
                "camera_place": camera.camera_place,
                "camera_place_cd": camera.camera_place_cd,
                "serial_number": camera.serial_number,
                "camera_type_cd": camera.camera_type_cd,
                "camera_type": camera.camera_type,
                "camera_latitude": camera.camera_latitude,
                "camera_longitude": camera.camera_longitude,
                "archive": camera.archive,
                "azimuth": camera.azimuth,
                "process_dttm": camera.process_dttm,
                "created_at": camera.created_at,
                "updated_at": camera.updated_at,
                "videos_count": videos_count,
                "has_video": videos_count > 0,
            }
        )

    return response


@router.get("/geojson")
async def get_cameras_geojson(
    search: str | None = Query(None),
    model: str | None = Query(None),
    camera_type: str | None = Query(None),
    camera_class: str | None = Query(None),
    videos_from: int | None = Query(None, ge=0),
    videos_to: int | None = Query(None, ge=0),
    has_video: bool | None = Query(None),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    use_cache = all(
        value is None
        for value in [search, model, camera_type, camera_class, videos_from, videos_to, has_video]
    )

    if use_cache:
        cached = await get_cached_geojson(redis)
        if cached:
            return cached

    stmt = (
        select(Camera, func.count(Video.id).label("videos_count"))
        .outerjoin(Video, Video.camera_id == Camera.id)
        .group_by(Camera.id)
    )

    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(
            or_(
                Camera.camera_name.ilike(pattern),
                Camera.camera_id.ilike(pattern),
                Camera.camera_place.ilike(pattern),
            )
        )

    if model:
        stmt = stmt.where(Camera.model.ilike(f"%{model}%"))

    if camera_type:
        stmt = stmt.where(Camera.camera_type.ilike(f"%{camera_type}%"))

    if camera_class:
        stmt = stmt.where(Camera.camera_class.ilike(f"%{camera_class}%"))

    if videos_from is not None:
        stmt = stmt.having(func.count(Video.id) >= videos_from)

    if videos_to is not None:
        stmt = stmt.having(func.count(Video.id) <= videos_to)

    if has_video is True:
        stmt = stmt.having(func.count(Video.id) > 0)

    if has_video is False:
        stmt = stmt.having(func.count(Video.id) == 0)

    result = await db.execute(stmt)
    rows = result.all()

    payload = {
        "type": "FeatureCollection",
        "features": [],
    }

    for camera, videos_count in rows:
        payload["features"].append(
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [
                        camera.camera_longitude,
                        camera.camera_latitude,
                    ],
                },
                "properties": {
                    "id": str(camera.id),
                    "camera_id": camera.camera_id,
                    "camera_name": camera.camera_name,
                    "camera_place": camera.camera_place,
                    "model": camera.model,
                    "serial_number": camera.serial_number,
                    "camera_type": camera.camera_type,
                    "azimuth": camera.azimuth,
                    "archive": camera.archive,
                    "videos_count": videos_count,
                    "has_video": videos_count > 0,
                },
            }
        )

    if use_cache:
        await set_cached_geojson(redis, payload)

    return payload


@router.get("/{camera_id}", response_model=CameraResponse)
async def get_camera(
    camera_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Camera, func.count(Video.id).label("videos_count"))
        .outerjoin(Video, Video.camera_id == Camera.id)
        .where(Camera.id == camera_id)
        .group_by(Camera.id)
    )

    result = await db.execute(stmt)
    row = result.first()

    if not row:
        raise HTTPException(status_code=404, detail="Camera not found")

    camera, videos_count = row

    return {
        "id": camera.id,
        "camera_id": camera.camera_id,
        "camera_class_cd": camera.camera_class_cd,
        "camera_class": camera.camera_class,
        "model": camera.model,
        "camera_name": camera.camera_name,
        "camera_place": camera.camera_place,
        "camera_place_cd": camera.camera_place_cd,
        "serial_number": camera.serial_number,
        "camera_type_cd": camera.camera_type_cd,
        "camera_type": camera.camera_type,
        "camera_latitude": camera.camera_latitude,
        "camera_longitude": camera.camera_longitude,
        "archive": camera.archive,
        "azimuth": camera.azimuth,
        "process_dttm": camera.process_dttm,
        "created_at": camera.created_at,
        "updated_at": camera.updated_at,
        "videos_count": videos_count,
        "has_video": videos_count > 0,
    }


@router.get("/{camera_id}/details")
async def get_camera_details(
    camera_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Camera, func.count(Video.id).label("videos_count"))
        .outerjoin(Video, Video.camera_id == Camera.id)
        .where(Camera.id == camera_id)
        .group_by(Camera.id)
    )

    result = await db.execute(stmt)
    row = result.first()

    if not row:
        raise HTTPException(status_code=404, detail="Camera not found")

    camera, videos_count = row

    videos_stmt = (
        select(Video, User)
        .join(User, Video.user_id == User.id)
        .where(Video.camera_id == camera_id)
        .order_by(Video.uploaded_at.desc())
    )

    videos_result = await db.execute(videos_stmt)
    videos_rows = videos_result.all()

    minio_service = MinioService()

    videos = []
    for video, user in videos_rows:
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

        videos.append(
            {
                "id": video.id,
                "user_id": video.user_id,
                "user_full_name": user.full_name,
                "user_email": user.email,
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
        )

    return {
        "camera": {
            "id": camera.id,
            "camera_id": camera.camera_id,
            "camera_name": camera.camera_name,
            "camera_place": camera.camera_place,
            "model": camera.model,
            "camera_type": camera.camera_type,
            "camera_latitude": camera.camera_latitude,
            "camera_longitude": camera.camera_longitude,
            "videos_count": videos_count,
            "has_video": videos_count > 0,
        },
        "videos": videos,
        "videos_count": videos_count,
    }