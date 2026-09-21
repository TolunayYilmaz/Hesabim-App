from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, UUID4

from app.schemas.common import ORMModel


class ProjectCreate(BaseModel):
    """POST /api/projects istek gövdesi (company_id header'dan gelir).

    Form eslestirmesi:
    - "Proje Adi"          -> name
    - "Proje Aciklama"     -> description
    """

    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)


class ProjectResponse(ORMModel):
    """GET /api/projects yanit modeli (DB satirindan dogrulanir)."""

    id: UUID4
    company_id: UUID4
    name: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


# Geriye uyumluluk takusu
ProjectRead = ProjectResponse