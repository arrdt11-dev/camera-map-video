from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.camera import Camera
from app.models.video import Video

router = APIRouter()


# =========================
# CREATE CAMERA
# =========================
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


# =========================
# HELPERS
# =========================
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


# =========================
# LIST
# =========================
@router.get("/")
async def list_cameras(
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Camera, func.count(Video.id).label("videos_count"))
        .outerjoin(Video, Video.camera_id == Camera.id)
        .group_by(Camera.id)
    )

    result = await db.execute(stmt)
    rows = result.all()

    return [
        _build_camera_payload(camera, videos_count)
        for camera, videos_count in rows
    ]


# =========================
# GEOJSON
# =========================
@router.get("/geojson")
async def get_cameras_geojson(
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Camera, func.count(Video.id).label("videos_count"))
        .outerjoin(Video, Video.camera_id == Camera.id)
        .group_by(Camera.id)
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


# =========================
# GET ONE
# =========================
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