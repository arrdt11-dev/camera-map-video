import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.camera import Camera
from app.models.user import User
from app.models.video import Video
from app.schemas.video import VideoCreate, VideoResponse

router = APIRouter(prefix="/videos", tags=["Videos"])


@router.post("/", response_model=VideoResponse, status_code=status.HTTP_201_CREATED)
async def create_video(
    payload: VideoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.camera_id:
        camera = await db.get(Camera, payload.camera_id)
        if not camera:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Camera not found",
            )

    video = Video(
        id=uuid.uuid4(),
        user_id=current_user.id,
        camera_id=payload.camera_id,
        filename=payload.filename,
        storage_key=f"{current_user.id}/{payload.filename}",
        latitude=payload.latitude,
        longitude=payload.longitude,
        status="uploaded",
    )

    db.add(video)
    await db.commit()
    await db.refresh(video)
    return video


@router.get("/", response_model=list[VideoResponse])
async def list_videos(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Video)
        .where(Video.user_id == current_user.id)
        .order_by(Video.uploaded_at.desc())
    )
    return result.scalars().all()


@router.get("/{video_id}", response_model=VideoResponse)
async def get_video(
    video_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Video).where(
            Video.id == video_id,
            Video.user_id == current_user.id,
        )
    )
    video = result.scalar_one_or_none()

    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )

    return video


@router.delete("/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_video(
    video_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Video).where(
            Video.id == video_id,
            Video.user_id == current_user.id,
        )
    )
    video = result.scalar_one_or_none()

    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Video not found",
        )

    await db.delete(video)
    await db.commit()