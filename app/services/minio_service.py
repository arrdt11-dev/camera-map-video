from io import BytesIO

from minio import Minio
from minio.error import S3Error

from app.core.config import settings


class MinioService:
    def __init__(self) -> None:
        self.endpoint = settings.MINIO_ENDPOINT
        self.public_endpoint = settings.MINIO_PUBLIC_ENDPOINT
        self.access_key = settings.MINIO_ACCESS_KEY
        self.secret_key = settings.MINIO_SECRET_KEY
        self.secure = settings.MINIO_SECURE

        self.bucket_videos = settings.MINIO_BUCKET_VIDEOS
        self.bucket_previews = settings.MINIO_BUCKET_PREVIEWS

        endpoint_without_scheme = self.endpoint.replace("http://", "").replace("https://", "")

        self.client = Minio(
            endpoint_without_scheme,
            access_key=self.access_key,
            secret_key=self.secret_key,
            secure=self.secure,
        )

        self._ensure_bucket_exists(self.bucket_videos)
        self._ensure_bucket_exists(self.bucket_previews)

    def _ensure_bucket_exists(self, bucket_name: str) -> None:
        if not self.client.bucket_exists(bucket_name):
            self.client.make_bucket(bucket_name)

    def upload_bytes(
        self,
        bucket_name: str,
        object_name: str,
        data: bytes,
        content_type: str,
    ) -> None:
        data_stream = BytesIO(data)
        self.client.put_object(
            bucket_name=bucket_name,
            object_name=object_name,
            data=data_stream,
            length=len(data),
            content_type=content_type,
        )

    def delete_object(self, bucket_name: str, object_name: str) -> None:
        try:
            self.client.remove_object(bucket_name, object_name)
        except S3Error:
            pass

    def get_public_url(self, bucket_name: str, object_name: str) -> str:
        base = self.public_endpoint.rstrip("/")
        return f"{base}/{bucket_name}/{object_name}"