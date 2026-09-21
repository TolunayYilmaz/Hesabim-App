from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, UUID4

from app.schemas.common import ORMModel


class ChequeBondBase(BaseModel):
    identity_id: Optional[UUID4] = None
    cash_account_id: Optional[UUID4] = None
    type: str = Field(default="Cheque", pattern="^(Cheque|Bond)$")
    serial_no: Optional[str] = Field(default=None, max_length=100)
    amount: Decimal = Field(default=Decimal("0"), ge=0)
    currency_rate: Decimal = Field(default=Decimal("0"), ge=0)
    deduction: Decimal = Field(default=Decimal("0"), ge=0)
    collection_date: Optional[date] = None
    due_date: Optional[date] = None
    payment_date: Optional[date] = None
    payment_method: Optional[str] = Field(default=None, max_length=50)
    bank_name: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)


class ChequeBondCreate(ChequeBondBase):
    status: str = Field(default="Portfoyde", max_length=50)


class ChequeBondUpdate(BaseModel):
    identity_id: Optional[UUID4] = None
    cash_account_id: Optional[UUID4] = None
    amount: Optional[Decimal] = Field(default=None, ge=0)
    currency_rate: Optional[Decimal] = Field(default=None, ge=0)
    deduction: Optional[Decimal] = Field(default=None, ge=0)
    collection_date: Optional[date] = None
    due_date: Optional[date] = None
    payment_date: Optional[date] = None
    payment_method: Optional[str] = Field(default=None, max_length=50)
    bank_name: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)
    status: Optional[str] = Field(default=None, max_length=50)


class ChequeBondResponse(ORMModel):
    """GET /api/cheques-bonds yanit modeli (DB satirindan dogrulanir).

    Form eslestirmesi:
    - "Tahsilat Tarihi"          -> collection_date
    - "Odeme Tarihi"             -> payment_date
    - "Cek Tutari"               -> amount
    - "Kur"                      -> currency_rate
    - "Masraf Kesintisi"         -> deduction
    - "Kasa/Hesap"               -> cash_account_id
    - "Odeme Sekli"              -> payment_method
    - "Tahsile Verilen Banka"    -> bank_name
    - "Aciklama"                 -> description
    """

    id: UUID4
    company_id: UUID4
    identity_id: Optional[UUID4] = None
    cash_account_id: Optional[UUID4] = None
    type: str
    serial_no: Optional[str] = None
    amount: Decimal
    currency_rate: Decimal
    deduction: Decimal
    collection_date: Optional[date] = None
    due_date: Optional[date] = None
    payment_date: Optional[date] = None
    payment_method: Optional[str] = None
    bank_name: Optional[str] = None
    status: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


# Geriye uyumluluk takusu
ChequeBondRead = ChequeBondResponse