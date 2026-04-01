import json

from redis.asyncio import Redis

CAMERAS_GEOJSON_CACHE_KEY = "cameras:geojson"
CAMERAS_GEOJSON_CACHE_TTL = 300


async def get_cached_geojson(redis: Redis) -> dict | None:
    cached = await redis.get(CAMERAS_GEOJSON_CACHE_KEY)
    if not cached:
        return None

    if isinstance(cached, bytes):
        cached = cached.decode("utf-8")

    return json.loads(cached)


async def set_cached_geojson(redis: Redis, payload: dict) -> None:
    await redis.set(
        CAMERAS_GEOJSON_CACHE_KEY,
        json.dumps(payload, ensure_ascii=False),
        ex=CAMERAS_GEOJSON_CACHE_TTL,
    )


async def invalidate_geojson_cache(redis: Redis) -> None:
    await redis.delete(CAMERAS_GEOJSON_CACHE_KEY)