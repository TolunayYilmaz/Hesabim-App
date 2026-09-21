from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, UUID4

from app.schemas.common import ORMModel


class FinancialTransactionCreate(BaseModel):
    cash_account_id: UUID4
    identity_id: Optional[UUID4] = None
    amount: Decimal = Field(gt=0)
    transaction_date: date
    transaction_type: str = Field(default="Tahsilat", max_length=50)
    description: Optional[str] = None


class FinancialTransactionUpdate(BaseModel):
    cash_account_id: Optional[UUID4] = None
    identity_id: Optional[UUID4] = None
    amount: Optional[Decimal] = Field(default=None, gt=0)
    transaction_date: Optional[date] = None
    transaction_type: Optional[str] = Field(default=None, max_length=50)
    description: Optional[str] = None


class FinancialTransactionRead(ORMModel):
    id: UUID4
    company_id: UUID4
    cash_account_id: UUID4
    identity_id: Optional[UUID4] = None
    amount: Decimal
    transaction_date: date
    transaction_type: str
    description: Optional[str] = None
    created_at: datetime