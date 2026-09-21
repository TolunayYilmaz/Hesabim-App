from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, UUID4

from app.schemas.common import ORMModel


class CreditCreate(BaseModel):
    """POST /api/credits istek gövdesi (company_id header'dan gelir).

    Form eslestirmesi:
    - "Kredi Adi"                       -> name
    - "Kalan Borc Tutari"               -> remaining_debt
    - "Kalan Taksit Sayisi..."          -> remaining_installments (0..144)
    - "Siradaki Ilk Taksit Tarihi"      -> first_installment_date
    - "Odeme Takvimi"                   -> payment_schedule
    - "Odediginiz Hesap"                -> cash_account_id
    - "Notlar"                          -> notes
    """

    name: str = Field(min_length=1, max_length=255)
    remaining_debt: Decimal = Field(default=Decimal("0"), ge=0)
    remaining_installments: int = Field(default=0, ge=0, le=144)
    first_installment_date: Optional[date] = None
    payment_schedule: str = Field(default="Her Ay", max_length=50)
    cash_account_id: Optional[UUID4] = None
    notes: Optional[str] = Field(default=None, max_length=1000)


class CreditUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    remaining_debt: Optional[Decimal] = Field(default=None, ge=0)
    remaining_installments: Optional[int] = Field(default=None, ge=0, le=144)
    first_installment_date: Optional[date] = None
    payment_schedule: Optional[str] = Field(default=None, max_length=50)
    cash_account_id: Optional[UUID4] = None
    notes: Optional[str] = Field(default=None, max_length=1000)


class CreditResponse(ORMModel):
    """GET /api/credits yanit modeli (DB satirindan dogrulanir)."""

    id: UUID4
    company_id: UUID4
    cash_account_id: Optional[UUID4] = None
    name: str
    remaining_debt: Decimal
    remaining_installments: int
    first_installment_date: Optional[date] = None
    payment_schedule: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


# Geriye uyumluluk takusu
CreditRead = CreditResponse