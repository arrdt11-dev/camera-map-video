from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    organization: Optional[str] = None


class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    organization: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True