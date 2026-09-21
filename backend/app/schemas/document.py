from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, UUID4

from app.schemas.common import ORMModel


class DocumentItemBase(BaseModel):
    product_id: UUID4
    quantity: Decimal = Field(default=Decimal("1"), ge=0)
    unit_price: Decimal = Field(default=Decimal("0"), ge=0)
    discount: Decimal = Field(default=Decimal("0"), ge=0)
    tax_rate: Decimal = Field(default=Decimal("0"), ge=0, le=100)


class DocumentItemCreate(DocumentItemBase):
    pass


class DocumentItemRead(DocumentItemBase, ORMModel):
    id: UUID4
    document_id: UUID4


class DocumentBase(BaseModel):
    identity_id: UUID4
    doc_type: str = Field(
        default="SalesInvoice",
        pattern="^(SalesInvoice|PurchaseInvoice|Proposal|Waybill)$",
    )
    document_no: str = Field(min_length=1, max_length=50)
    issue_date: date
    due_date: Optional[date] = None
    status: str = Field(default="Draft", max_length=50)
    phone: Optional[str] = Field(default=None, max_length=50)
    tax_office: Optional[str] = Field(default=None, max_length=255)
    tax_no: Optional[str] = Field(default=None, max_length=50)
    address: Optional[str] = None


class DocumentCreate(DocumentBase):
    items: list[DocumentItemCreate] = Field(default_factory=list)


class DocumentUpdate(BaseModel):
    identity_id: Optional[UUID4] = None
    document_no: Optional[str] = Field(default=None, max_length=50)
    issue_date: Optional[date] = None
    due_date: Optional[date] = None
    status: Optional[str] = Field(default=None, max_length=50)
    phone: Optional[str] = Field(default=None, max_length=50)
    tax_office: Optional[str] = Field(default=None, max_length=255)
    tax_no: Optional[str] = Field(default=None, max_length=50)
    address: Optional[str] = None


class DocumentRead(DocumentBase, ORMModel):
    id: UUID4
    company_id: UUID4
    total_amount: Decimal
    created_at: datetime
    updated_at: Optional[datetime] = None
    items: list[DocumentItemRead] = Field(default_factory=list)


class DocumentFull(DocumentRead):
    identity_name: Optional[str] = None