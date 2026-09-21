from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, UUID4

from app.schemas.common import ORMModel


class WarehouseBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    is_active: bool = True


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    is_active: Optional[bool] = None


class WarehouseRead(WarehouseBase, ORMModel):
    id: UUID4
    company_id: UUID4
    created_at: datetime
    updated_at: Optional[datetime] = None