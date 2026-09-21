from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, UUID4

from app.schemas.common import ORMModel


class ExpenseCreate(BaseModel):
    """POST /api/expenses istek gövdesi (company_id header'dan gelir).

    Form eslestirmesi:
    - "Islem Tarihi"          -> expense_date
    - "Fis/Belge No"          -> document_no
    - "Odeme Tarihi"          -> payment_date
    - "Tutar (KDV Dahil)"     -> amount
    - "Tekrarlayan masraf..." -> is_recurring
    - "Masraf Kalemi"         -> category
    - "Odeme Durumu"          -> payment_status ("Odendi" / "Daha sonra odenecek")
    - "Kasa/Hesap"            -> cash_account_id
    - "KDV Orani (%)"         -> tax_rate
    - "Aciklama"              -> description
    """

    expense_date: date
    document_no: Optional[str] = Field(default=None, max_length=50)
    payment_date: Optional[date] = None
    amount: Decimal = Field(gt=0)
    is_recurring: bool = Field(default=False)
    category: str = Field(default="Genel", max_length=100)
    payment_status: str = Field(default="Odendi", max_length=50)
    cash_account_id: Optional[UUID4] = None
    tax_rate: Decimal = Field(default=Decimal("0"), ge=0, le=100)
    description: Optional[str] = Field(default=None, max_length=1000)


class ExpenseUpdate(BaseModel):
    expense_date: Optional[date] = None
    document_no: Optional[str] = Field(default=None, max_length=50)
    payment_date: Optional[date] = None
    amount: Optional[Decimal] = Field(default=None, gt=0)
    is_recurring: Optional[bool] = None
    category: Optional[str] = Field(default=None, max_length=100)
    payment_status: Optional[str] = Field(default=None, max_length=50)
    cash_account_id: Optional[UUID4] = None
    tax_rate: Optional[Decimal] = Field(default=None, ge=0, le=100)
    description: Optional[str] = Field(default=None, max_length=1000)


class ExpenseResponse(ORMModel):
    """GET /api/expenses yanit modeli (DB satirindan dogrulanir)."""

    id: UUID4
    company_id: UUID4
    cash_account_id: Optional[UUID4] = None
    cash_account_name: Optional[str] = None
    category: str
    amount: Decimal
    tax_rate: Decimal
    document_no: Optional[str] = None
    expense_date: date
    payment_date: Optional[date] = None
    payment_status: str
    is_recurring: bool
    description: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


# Geriye uyumluluk takusu
ExpenseRead = ExpenseResponse