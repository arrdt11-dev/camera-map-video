from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.camera import Camera
from app.models.video import Video

router = APIRouter()


def _build_camera_payload(camera: Camera, videos_count: int) -> dict:
    return {
        "id": str(camera.id),
        "camera_id": camera.camera_id,
        "camera_name": camera.camera_name,
        "camera_place": camera.camera_place,
        "camera_class": camera.camera_class,
        "model": camera.model,
        "serial_number": camera.serial_number,
        "camera_type": camera.camera_type,
        "azimuth": camera.azimuth,
        "archive": camera.archive,
        "camera_latitude": camera.camera_latitude,
        "camera_longitude": camera.camera_longitude,
        "videos_count": videos_count,
        "has_video": videos_count > 0,
    }


def _build_filtered_stmt(
    search: str | None = None,
    model: str | None = None,
    camera_type: str | None = None,
    camera_class: str | None = None,
    min_videos: int | None = None,
    max_videos: int | None = None,
):
    videos_count = func.count(Video.id)

    stmt = (
        select(Camera, videos_count.label("videos_count"))
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

    if min_videos is not None:
        stmt = stmt.having(videos_count >= min_videos)

    if max_videos is not None:
        stmt = stmt.having(videos_count <= max_videos)

    return stmt


@router.post("/")
async def create_camera(
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    camera = Camera(
        camera_id=payload.get("camera_id"),
        camera_name=payload.get("camera_name"),
        camera_latitude=payload.get("camera_latitude"),
        camera_longitude=payload.get("camera_longitude"),
    )

    db.add(camera)
    await db.commit()
    await db.refresh(camera)

    return {"id": str(camera.id), "camera_name": camera.camera_name}


@router.get("/")
async def list_cameras(
    search: str | None = Query(default=None),
    model: str | None = Query(default=None),
    camera_type: str | None = Query(default=None),
    camera_class: str | None = Query(default=None),
    min_videos: int | None = Query(default=None, ge=0),
    max_videos: int | None = Query(default=None, ge=0),
    db: AsyncSession = Depends(get_db),
):
    stmt = _build_filtered_stmt(
        search=search,
        model=model,
        camera_type=camera_type,
        camera_class=camera_class,
        min_videos=min_videos,
        max_videos=max_videos,
    )

    result = await db.execute(stmt)
    rows = result.all()

    return [
        _build_camera_payload(camera, videos_count)
        for camera, videos_count in rows
    ]


@router.get("/geojson")
async def get_cameras_geojson(
    search: str | None = Query(default=None),
    model: str | None = Query(default=None),
    camera_type: str | None = Query(default=None),
    camera_class: str | None = Query(default=None),
    min_videos: int | None = Query(default=None, ge=0),
    max_videos: int | None = Query(default=None, ge=0),
    db: AsyncSession = Depends(get_db),
):
    stmt = _build_filtered_stmt(
        search=search,
        model=model,
        camera_type=camera_type,
        camera_class=camera_class,
        min_videos=min_videos,
        max_videos=max_videos,
    )

    result = await db.execute(stmt)
    rows = result.all()

    features = []

    for camera, videos_count in rows:
        if camera.camera_longitude is None or camera.camera_latitude is None:
            continue

        features.append(
            {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [
                        camera.camera_longitude,
                        camera.camera_latitude,
                    ],
                },
                "properties": _build_camera_payload(camera, videos_count),
            }
        )

    return {
        "type": "FeatureCollection",
        "features": features,
    }


@router.get("/{camera_id}")
async def get_camera(camera_id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Camera, func.count(Video.id).label("videos_count"))
        .outerjoin(Video, Video.camera_id == Camera.id)
        .where(Camera.id == camera_id)
        .group_by(Camera.id)
    )

    result = await db.execute(stmt)
    row = result.first()

    if not row:
        return {"detail": "Камера не найдена"}

    camera, videos_count = row
    return _build_camera_payload(camera, videos_count)