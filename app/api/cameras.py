from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.camera import Camera
from app.models.video import Video
from app.schemas.camera import CameraCreate, CameraResponse

router = APIRouter(prefix="/cameras", tags=["Cameras"])


def camera_to_response(camera: Camera, videos_count: int = 0) -> CameraResponse:
    return CameraResponse(
        id=camera.id,
        camera_id=camera.camera_id,
        camera_class_cd=camera.camera_class_cd,
        camera_class=camera.camera_class,
        model=camera.model,
        camera_name=camera.camera_name,
        camera_place=camera.camera_place,
        camera_place_cd=camera.camera_place_cd,
        serial_number=camera.serial_number,
        camera_type_cd=camera.camera_type_cd,
        camera_type=camera.camera_type,
        camera_latitude=camera.camera_latitude,
        camera_longitude=camera.camera_longitude,
        archive=camera.archive,
        azimuth=camera.azimuth,
        process_dttm=camera.process_dttm,
        created_at=camera.created_at,
        updated_at=camera.updated_at,
        videos_count=videos_count,
        has_video=videos_count > 0,
    )


@router.get("/", response_model=list[CameraResponse])
async def list_cameras(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(
            Camera,
            func.count(Video.id).label("videos_count"),
        )
        .outerjoin(Video, Video.camera_id == Camera.id)
        .group_by(Camera.id)
        .order_by(Camera.created_at.desc())
        .offset(skip)
        .limit(limit)
    )

    result = await db.execute(stmt)
    rows = result.all()

    return [
        camera_to_response(camera=row[0], videos_count=row[1])
        for row in rows
    ]


@router.post("/", response_model=CameraResponse)
async def create_camera(
    camera_in: CameraCreate,
    db: AsyncSession = Depends(get_db),
):
    existing_stmt = select(Camera).where(Camera.camera_id == camera_in.camera_id)
    existing_result = await db.execute(existing_stmt)
    existing_camera = existing_result.scalar_one_or_none()

    if existing_camera:
        raise HTTPException(status_code=400, detail="Camera with this camera_id already exists")

    camera = Camera(**camera_in.model_dump())

    db.add(camera)
    await db.commit()
    await db.refresh(camera)

    return camera_to_response(camera=camera, videos_count=0)


@router.get("/geojson")
async def get_cameras_geojson(
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(
            Camera,
            func.count(Video.id).label("videos_count"),
        )
        .outerjoin(Video, Video.camera_id == Camera.id)
        .group_by(Camera.id)
        .order_by(Camera.created_at.desc())
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

    return {
        "type": "FeatureCollection",
        "features": features,
    }


@router.get("/{camera_id}", response_model=CameraResponse)
async def get_camera(
    camera_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(
            Camera,
            func.count(Video.id).label("videos_count"),
        )
        .outerjoin(Video, Video.camera_id == Camera.id)
        .where(Camera.id == camera_id)
        .group_by(Camera.id)
    )

    result = await db.execute(stmt)
    row = result.first()

    if not row:
        raise HTTPException(status_code=404, detail="Camera not found")

    camera, videos_count = row
    return camera_to_response(camera=camera, videos_count=videos_count)