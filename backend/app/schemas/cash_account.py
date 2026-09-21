from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, UUID4

from app.schemas.common import ORMModel


class CashAccountBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    currency: str = Field(default="TRY", max_length=10)


class CashAccountCreate(CashAccountBase):
    pass


class CashAccountUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    currency: Optional[str] = Field(default=None, max_length=10)


class CashAccountRead(CashAccountBase, ORMModel):
    id: UUID4
    company_id: UUID4
    balance: Decimal
    created_at: datetime
    updated_at: Optional[datetime] = None