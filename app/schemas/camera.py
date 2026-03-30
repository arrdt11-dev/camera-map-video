import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CameraResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
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
    camera_latitude: float
    camera_longitude: float
    archive: bool
    azimuth: int | None = None
    process_dttm: datetime
    created_at: datetime
    updated_at: datetime


class CameraGeoJSONProperties(BaseModel):
    camera_id: str
    has_video: bool


class CameraGeoJSONGeometry(BaseModel):
    type: str = "Point"
    coordinates: list[float]


class CameraGeoJSONFeature(BaseModel):
    type: str = "Feature"
    properties: CameraGeoJSONProperties
    geometry: CameraGeoJSONGeometry


class CameraGeoJSONResponse(BaseModel):
    type: str = "FeatureCollection"
    features: list[CameraGeoJSONFeature]