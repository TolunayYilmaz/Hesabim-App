from app.crud import build_crud_router
from app.schemas.financial_transaction import (
    FinancialTransactionCreate,
    FinancialTransactionRead,
    FinancialTransactionUpdate,
)

router = build_crud_router(
    table="financial_transactions",
    read_schema=FinancialTransactionRead,
    create_schema=FinancialTransactionCreate,
    update_schema=FinancialTransactionUpdate,
    prefix="/financial-transactions",
    tag="Finansal Hareketler (Tahsilat / Odeme / Masraf)",
)