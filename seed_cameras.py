import asyncio
import uuid
from random import choice, randint, uniform

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.camera import Camera


CAMERA_CLASSES = [
    (1, "Городская"),
    (2, "Дворовая"),
    (3, "Транспортная"),
]

CAMERA_TYPES = [
    (1, "Фиксированная"),
    (2, "Поворотная"),
    (3, "Купольная"),
]

MODELS = [
    "Hikvision DS-2CD",
    "Dahua IPC-HFW",
    "Axis Q17",
    "Hanwha PNV",
]

PLACES = [
    "Москва, ул. Тверская",
    "Москва, Ленинградский проспект",
    "Москва, Кутузовский проспект",
    "Москва, проспект Мира",
    "Москва, Варшавское шоссе",
]


async def seed_cameras():
    async with SessionLocal() as session:
        existing = await session.execute(select(Camera.id).limit(1))
        if existing.scalar_one_or_none():
            print("Cameras already exist, skip seeding.")
            return

        cameras = []

        for i in range(1, 21):
            class_cd, class_name = choice(CAMERA_CLASSES)
            type_cd, type_name = choice(CAMERA_TYPES)

            camera = Camera(
                id=uuid.uuid4(),
                camera_id=f"{i:05d}",
                camera_class_cd=class_cd,
                camera_class=class_name,
                model=choice(MODELS),
                camera_name=f"Camera {i}",
                camera_place=choice(PLACES),
                camera_place_cd=randint(100, 999),
                serial_number=f"SN-{randint(100000, 999999)}",
                camera_type_cd=type_cd,
                camera_type=type_name,
                camera_latitude=uniform(55.55, 55.95),
                camera_longitude=uniform(37.35, 37.85),
                archive=False,
                azimuth=randint(0, 360),
            )
            cameras.append(camera)

        session.add_all(cameras)
        await session.commit()
        print(f"Inserted {len(cameras)} cameras.")


if __name__ == "__main__":
    asyncio.run(seed_cameras())