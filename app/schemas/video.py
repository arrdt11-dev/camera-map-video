import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class VideoCreate(BaseModel):
    filename: str
    camera_id: uuid.UUID | None = None
    latitude: float | None = None
    longitude: float | None = None


class VideoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    filename: str
    storage_key: str
    latitude: float | None = None
    longitude: float | None = None
    status: str
    uploaded_at: datetime