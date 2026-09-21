from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, UUID4

from app.schemas.common import ORMModel


class VariantCreate(BaseModel):
    """POST /api/variants istek gövdesi (company_id header'dan gelir).

    Form eslestirmesi:
    - "Varyant Ismi Ornegin: \"Renk, \"Ebat\", \"Beden\" vs..." -> name
    - "Varyant Degeri"                                          -> value
    - "Varyant Degeri" (opsiyonel coklu)                        -> product_id
    """

    name: str = Field(min_length=1, max_length=255)
    value: str = Field(min_length=1, max_length=255)
    product_id: Optional[UUID4] = None


class VariantUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    value: Optional[str] = Field(default=None, min_length=1, max_length=255)
    product_id: Optional[UUID4] = None


class VariantResponse(ORMModel):
    """GET /api/variants yanit modeli (DB satirindan dogrulanir)."""

    id: UUID4
    company_id: UUID4
    product_id: Optional[UUID4] = None
    name: str
    value: str
    created_at: datetime
    updated_at: Optional[datetime] = None


# Geriye uyumluluk takusu
VariantRead = VariantResponse