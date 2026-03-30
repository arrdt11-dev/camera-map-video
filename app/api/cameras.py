import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.camera import Camera
from app.models.video import Video
from app.schemas.camera import (
    CameraResponse,
    CameraGeoJSONFeature,
    CameraGeoJSONGeometry,
    CameraGeoJSONProperties,
    CameraGeoJSONResponse,
)

router = APIRouter(prefix="/cameras", tags=["Cameras"])



@router.get("/", response_model=list[CameraResponse])
async def list_cameras(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Camera))
    return result.scalars().all()



@router.get("/geojson", response_model=CameraGeoJSONResponse)
async def get_cameras_geojson(
    db: AsyncSession = Depends(get_db),
):
    # считаем количество видео по камерам
    video_counts = await db.execute(
        select(Video.camera_id, func.count(Video.id))
        .group_by(Video.camera_id)
    )

    video_map = {camera_id: count for camera_id, count in video_counts.all()}

    result = await db.execute(select(Camera))
    cameras = result.scalars().all()

    features = []

    for camera in cameras:
        has_video = video_map.get(camera.id, 0) > 0

        feature = CameraGeoJSONFeature(
            properties=CameraGeoJSONProperties(
                camera_id=camera.camera_id,
                has_video=has_video,
            ),
            geometry=CameraGeoJSONGeometry(
                coordinates=[
                    camera.camera_longitude,
                    camera.camera_latitude,
                ]
            ),
        )

        features.append(feature)

    return CameraGeoJSONResponse(features=features)