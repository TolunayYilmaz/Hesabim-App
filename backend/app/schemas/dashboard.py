from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, UUID4


class KpiCard(BaseModel):
    label: str
    value: Decimal
    currency: str = "TRY"


class DashboardSummary(BaseModel):
    """Genel gorunum (overview) icin ozet verileri."""

    cash_balance: Decimal = Decimal("0")
    customer_balance: Decimal = Decimal("0")
    supplier_balance: Decimal = Decimal("0")
    product_count: int = 0
    pending_cheques: int = 0
    pending_cheques_amount: Decimal = Decimal("0")
    monthly_expenses: Decimal = Decimal("0")


class RecentItem(BaseModel):
    id: UUID4
    name: str
    amount: Optional[Decimal] = None
    date: Optional[str] = None
    status: Optional[str] = None