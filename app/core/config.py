from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Camera Map Video Service"
    debug: bool = True

    database_url: str
    redis_url: str

    minio_endpoint: str
    minio_access_key: str
    minio_secret_key: str
    minio_bucket_videos: str
    minio_bucket_previews: str
    minio_secure: bool = False

    jwt_secret_key: str
    jwt_refresh_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()