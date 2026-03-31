from io import BytesIO

from minio import Minio

from app.core.config import settings


class MinioService:
    def __init__(self) -> None:
        self.client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
        self.videos_bucket = settings.MINIO_BUCKET_VIDEOS
        self.previews_bucket = settings.MINIO_BUCKET_PREVIEWS

    def ensure_bucket_exists(self, bucket_name: str) -> None:
        if not self.client.bucket_exists(bucket_name):
            self.client.make_bucket(bucket_name)

    def ensure_buckets(self) -> None:
        self.ensure_bucket_exists(self.videos_bucket)
        self.ensure_bucket_exists(self.previews_bucket)

    def upload_bytes(
        self,
        bucket_name: str,
        object_name: str,
        data: bytes,
        content_type: str,
    ) -> None:
        self.client.put_object(
            bucket_name=bucket_name,
            object_name=object_name,
            data=BytesIO(data),
            length=len(data),
            content_type=content_type,
        )


minio_service = MinioService()