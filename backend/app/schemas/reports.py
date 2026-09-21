from typing import Optional

from pydantic import BaseModel, Field


class SalesReportRow(BaseModel):
    identity_id: Optional[str] = None
    identity_name: str = ""
    identity_type: Optional[str] = None
    movement_count: int = 0
    credit_total: float = 0
    debit_total: float = 0
    net: float = 0


class ReportTotals(BaseModel):
    credit_total: float = 0
    debit_total: float = 0
    net: float = 0


class CariBakiyeItem(BaseModel):
    identity_id: str = ""
    identity_name: str = ""
    balance: float = 0


class CariOzet(BaseModel):
    overdue_receivable_count: int = 0
    overdue_receivable_amount: float = 0
    overdue_payable_count: int = 0
    overdue_payable_amount: float = 0
    debtors: list[CariBakiyeItem] = Field(default_factory=list)
    creditors: list[CariBakiyeItem] = Field(default_factory=list)


class DocumentStat(BaseModel):
    count: int = 0
    total: float = 0


class SalesReportResponse(BaseModel):
    rows: list[SalesReportRow] = Field(default_factory=list)
    totals: ReportTotals = Field(default_factory=ReportTotals)
    cari_ozet: CariOzet = Field(default_factory=CariOzet)
    document_stats: Optional[DocumentStat] = None


class InventoryReportRow(BaseModel):
    product_id: Optional[str] = None
    product_name: str = ""
    barcode: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    reorder_level: float = 0
    total_in: float = 0
    total_out: float = 0
    stock: float = 0


class InventoryReportResponse(BaseModel):
    rows: list[InventoryReportRow] = Field(default_factory=list)
    product_count: int = 0


class CashReportAccount(BaseModel):
    cash_account_id: Optional[str] = None
    cash_account_name: str = ""
    currency: Optional[str] = None
    opening_balance: float = 0
    period_in: float = 0
    period_out: float = 0
    net: float = 0
    closing_balance: float = 0


class CashReportTypeRow(BaseModel):
    transaction_type: str = ""
    movement_count: int = 0
    total: float = 0


class CashReportResponse(BaseModel):
    accounts: list[CashReportAccount] = Field(default_factory=list)
    type_rows: list[CashReportTypeRow] = Field(default_factory=list)
    total_in: float = 0
    total_out: float = 0