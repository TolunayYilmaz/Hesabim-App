from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, UUID4

from app.schemas.common import ORMModel


class ProductBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    barcode: Optional[str] = Field(default=None, max_length=50)
    category: Optional[str] = Field(default=None, max_length=255)
    brand: Optional[str] = Field(default=None, max_length=255)
    reorder_level: Decimal = Field(default=Decimal("0"), ge=0)


class ProductPricing(BaseModel):
    unit_price: Decimal = Field(default=Decimal("0"), ge=0)
    tax_rate: Decimal = Field(default=Decimal("0"), ge=0, le=100)


class ProductCreate(ProductBase, ProductPricing):
    is_active: bool = True


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    barcode: Optional[str] = Field(default=None, max_length=50)
    category: Optional[str] = Field(default=None, max_length=255)
    brand: Optional[str] = Field(default=None, max_length=255)
    reorder_level: Optional[Decimal] = Field(default=None, ge=0)
    unit_price: Optional[Decimal] = Field(default=None, ge=0)
    tax_rate: Optional[Decimal] = Field(default=None, ge=0, le=100)
    is_active: Optional[bool] = None


class ProductRead(ProductBase, ProductPricing, ORMModel):
    id: UUID4
    company_id: UUID4
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None