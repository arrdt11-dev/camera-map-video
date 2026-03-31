from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CameraCreate(BaseModel):
    camera_id: str
    camera_class_cd: int | None = None
    camera_class: str | None = None
    model: str | None = None
    camera_name: str
    camera_place: str | None = None
    camera_place_cd: int | None = None
    serial_number: str | None = None
    camera_type_cd: int | None = None
    camera_type: str | None = None
    camera_latitude: float | None = None
    camera_longitude: float | None = None
    archive: bool = False
    azimuth: int | None = None
    process_dttm: datetime | None = None


class CameraResponse(BaseModel):
    id: UUID
    camera_id: str
    camera_class_cd: int | None = None
    camera_class: str | None = None
    model: str | None = None
    camera_name: str
    camera_place: str | None = None
    camera_place_cd: int | None = None
    serial_number: str | None = None
    camera_type_cd: int | None = None
    camera_type: str | None = None
    camera_latitude: float | None = None
    camera_longitude: float | None = None
    archive: bool = False
    azimuth: int | None = None
    process_dttm: datetime | None = None
    created_at: datetime
    updated_at: datetime
    videos_count: int = 0
    has_video: bool = False

    model_config = ConfigDict(from_attributes=True)