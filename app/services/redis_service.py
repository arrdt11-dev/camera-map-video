import json

import redis.asyncio as redis

from app.core.config import settings


class RedisService:
    def __init__(self) -> None:
        self.client = redis.from_url(settings.REDIS_URL, decode_responses=True)

    async def get_json(self, key: str):
        value = await self.client.get(key)
        if value is None:
            return None
        return json.loads(value)

    async def set_json(self, key: str, value, ex: int | None = None) -> None:
        await self.client.set(key, json.dumps(value), ex=ex)

    async def delete(self, key: str) -> None:
        await self.client.delete(key)