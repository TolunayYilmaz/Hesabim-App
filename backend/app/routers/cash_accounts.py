from app.crud import build_crud_router
from app.schemas.cash_account import (
    CashAccountCreate,
    CashAccountRead,
    CashAccountUpdate,
)

router = build_crud_router(
    table="cash_accounts",
    read_schema=CashAccountRead,
    create_schema=CashAccountCreate,
    update_schema=CashAccountUpdate,
    prefix="/cash-accounts",
    tag="Kasa / Banka Hesaplari",
)