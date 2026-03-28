import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Camera(Base):
    __tablename__ = "cameras"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    camera_id: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )

    camera_class_cd: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    camera_class: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    model: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    camera_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )

    camera_place: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    camera_place_cd: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    serial_number: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    camera_type_cd: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    camera_type: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    camera_latitude: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    camera_longitude: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    archive: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )

    azimuth: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    process_dttm: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    videos = relationship(
        "Video",
        back_populates="camera",
        cascade="all, delete-orphan",
    )