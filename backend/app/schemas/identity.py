from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, UUID4

from app.schemas.common import ORMModel


class IdentityBase(BaseModel):
    identity_type: str = Field(default="Customer", pattern="^(Customer|Supplier)$")
    name: str = Field(min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=50)
    tax_office: Optional[str] = Field(default=None, max_length=255)
    tax_number: Optional[str] = Field(default=None, max_length=50)
    address: Optional[str] = None
    bank_info: Optional[str] = None


class IdentityBusiness(BaseModel):
    due_days: int = Field(default=0, ge=0)
    discount_rate: Decimal = Field(default=Decimal("0"), ge=0, le=100)
    currency: str = Field(default="TRY", max_length=10)


class IdentityCreate(IdentityBase, IdentityBusiness):
    """POST /api/identities istek gövdesi (company_id header'dan gelir)."""

    pass


class IdentityUpdate(BaseModel):
    identity_type: Optional[str] = Field(default=None, pattern="^(Customer|Supplier)$")
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=50)
    tax_office: Optional[str] = Field(default=None, max_length=255)
    tax_number: Optional[str] = Field(default=None, max_length=50)
    address: Optional[str] = None
    bank_info: Optional[str] = None
    due_days: Optional[int] = Field(default=None, ge=0)
    discount_rate: Optional[Decimal] = Field(default=None, ge=0, le=100)
    currency: Optional[str] = Field(default=None, max_length=10)


class IdentityResponse(IdentityBase, IdentityBusiness, ORMModel):
    """GET /api/identities yanit modeli (DB satirindan dogrulanir)."""

    id: UUID4
    company_id: UUID4
    balance: Decimal
    created_at: datetime
    updated_at: Optional[datetime] = None


# Geriye uyumluluk takusu
IdentityRead = IdentityResponse