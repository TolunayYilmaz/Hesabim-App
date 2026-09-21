from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, UUID4

from app.schemas.common import ORMModel


class ProductionCreate(BaseModel):
    """POST /api/production istek gövdesi (company_id header'dan gelir).

    Form eslestirmesi:
    - "Uretim tarihi"                        -> production_date
    - "Uretim yaptiginiz miktari girin"      -> quantity
    - "Urun Adi / Kodu"                      -> product_id
    - "Marka"                                -> brand
    - "Kategori"                             -> category
    - "Uretilen varyanti secin"              -> variant_id
    - "Uretimin girecegi depoyu secin"       -> warehouse_id
    - "Aciklama girin"                       -> description
    """

    production_date: date
    quantity: Decimal = Field(gt=0)
    product_id: UUID4
    variant_id: Optional[UUID4] = None
    warehouse_id: UUID4
    brand: Optional[str] = Field(default=None, max_length=255)
    category: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)


class ProductionUpdate(BaseModel):
    production_date: Optional[date] = None
    quantity: Optional[Decimal] = Field(default=None, gt=0)
    product_id: Optional[UUID4] = None
    variant_id: Optional[UUID4] = None
    warehouse_id: Optional[UUID4] = None
    brand: Optional[str] = Field(default=None, max_length=255)
    category: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)


class ProductionResponse(ORMModel):
    """GET /api/production yanit modeli (DB satirindan dogrulanir)."""

    id: UUID4
    company_id: UUID4
    product_id: UUID4
    variant_id: Optional[UUID4] = None
    warehouse_id: UUID4
    production_date: date
    quantity: Decimal
    brand: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


# Geriye uyumluluk takusu
ProductionRead = ProductionResponse