from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr


class UserRegister(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    organization: str | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    organization: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime