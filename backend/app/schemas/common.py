from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, UUID4


class ORMModel(BaseModel):
    """Veritabani satirlarindan (dict) dogrudan dogrulanabilir taban model."""

    model_config = ConfigDict(from_attributes=True)


class TimestampedModel(ORMModel):
    id: UUID4
    company_id: Optional[UUID4] = None
    created_at: datetime
    updated_at: Optional[datetime] = None