from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, UUID4

from app.schemas.common import ORMModel


class StockTransactionBase(BaseModel):
    product_id: UUID4
    warehouse_id: UUID4
    transaction_type: str = Field(default="Entry", pattern="^(Entry|Exit|Production)$")
    quantity: Decimal = Field(default=Decimal("0"))
    transaction_date: date


class StockTransactionCreate(StockTransactionBase):
    pass


class StockTransactionRead(StockTransactionBase, ORMModel):
    id: UUID4
    created_at: datetime


class StockSummary(BaseModel):
    """Bir urunun depo bazinda mevcut stok ozeti."""

    product_id: UUID4
    product_name: str = ""
    barcode: Optional[str] = None
    total_in: Decimal = Decimal("0")
    total_out: Decimal = Decimal("0")
    stock: Decimal = Decimal("0")


class StockTotals(BaseModel):
    """Stok hareketlerinin toplami (urun + depo filtrelerine gore)."""

    total_in: Decimal = Decimal("0")
    total_out: Decimal = Decimal("0")