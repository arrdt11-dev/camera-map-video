from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class VideoResponse(BaseModel):
    id: UUID
    user_id: UUID
    user_full_name: str | None = None
    user_email: str | None = None
    camera_id: UUID | None = None
    filename: str
    storage_key: str
    preview_key: str | None = None
    video_url: str | None = None
    preview_url: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    status: str
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)