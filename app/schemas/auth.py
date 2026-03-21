from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    organization: str | None = None


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    organization: str | None = None
    is_active: bool


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"