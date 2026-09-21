from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, UUID4

from app.schemas.common import ORMModel


class AssetCreate(BaseModel):
    """POST /api/assets istek gövdesi (company_id header'dan gelir).

    Form eslestirmesi:
    - "Demirbas Adi"               -> name
    - "Seri No"                    -> serial_number
    - "Alis Tarihi (istege bagli)" -> purchase_date
    - "Fiyati (istege bagli)"      -> price
    - "Aciklamasi"                 -> description
    """

    name: str = Field(min_length=1, max_length=255)
    serial_number: Optional[str] = Field(default=None, max_length=255)
    purchase_date: Optional[date] = None
    price: Decimal = Field(default=Decimal("0"), ge=0)
    description: Optional[str] = Field(default=None, max_length=1000)


class AssetUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    serial_number: Optional[str] = Field(default=None, max_length=255)
    purchase_date: Optional[date] = None
    price: Optional[Decimal] = Field(default=None, ge=0)
    description: Optional[str] = Field(default=None, max_length=1000)


class AssetResponse(ORMModel):
    """GET /api/assets yanit modeli (DB satirindan dogrulanir)."""

    id: UUID4
    company_id: UUID4
    name: str
    serial_number: Optional[str] = None
    purchase_date: Optional[date] = None
    price: Decimal
    description: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


# Geriye uyumluluk takusu
AssetRead = AssetResponse