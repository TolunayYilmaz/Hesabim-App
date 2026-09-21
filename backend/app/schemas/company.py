from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, UUID4

from app.schemas.common import ORMModel


class CompanyBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    tax_office: Optional[str] = None
    tax_number: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    title: Optional[str] = None
    tax_office: Optional[str] = None
    tax_number: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None


class CompanyRead(CompanyBase, ORMModel):
    id: UUID4
    created_at: datetime
    updated_at: Optional[datetime] = None


class CompanyUserAdd(BaseModel):
    """Bir kullaniciyi sirkete uye olarak ekler (sirket admin'i islem yapar)."""

    email: EmailStr
    role: str = "user"


class CompanyUserRead(ORMModel):
    company_id: UUID4
    user_id: UUID4
    role: str
    created_at: datetime