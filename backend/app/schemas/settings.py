from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, UUID4

from app.schemas.common import ORMModel


class FirmSettingsUpdate(BaseModel):
    """Firma Ayarlari formuna ait guncellenebilir alanlar."""

    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    tax_office: Optional[str] = None
    tax_number: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    bank_info: Optional[str] = None
    logo_url: Optional[str] = None


class FirmSettingsRead(FirmSettingsUpdate, ORMModel):
    id: UUID4
    created_at: datetime
    updated_at: Optional[datetime] = None
    has_api_key: bool = False


class ApiKeyResponse(BaseModel):
    api_key: str