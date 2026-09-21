from typing import Optional

from pydantic import BaseModel, EmailStr, Field, UUID4

from app.schemas.common import ORMModel


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(default="", max_length=255)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    user: "UserRead"


class UserRead(ORMModel):
    id: UUID4
    email: EmailStr
    full_name: str
    role: str
    is_active: bool


TokenResponse.model_rebuild()