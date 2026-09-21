from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, Query, status

from app.deps import get_company_id, get_user_client_dep
from app.models.base import TableRepository
from app.schemas.stock import (
    StockSummary,
    StockTotals,
    StockTransactionCreate,
    StockTransactionRead,
)

router = APIRouter(prefix="/stock", tags=["Stok"])


@router.get("/summary", response_model=list[StockSummary])
def stock_summary(
    company_id: str = Depends(get_company_id),
    client=Depends(get_user_client_dep),
):
    """Depo bazinda urunlerin stok ozeti (RPC ile toplanir)."""
    res = client.rpc("get_stock_summaries", {"p_company_id": company_id}).execute()
    return [StockSummary.model_validate(r) for r in res.data]


@router.get("/totals", response_model=StockTotals)
def stock_totals(
    warehouse_id: Optional[str] = None,
    product_id: Optional[str] = None,
    company_id: str = Depends(get_company_id),
    client=Depends(get_user_client_dep),
):
    """Giris / cikis toplamlari (depo veya urun bazinda filteralanabilir)."""
    rows = _query_transactions(client, company_id, warehouse_id, product_id, limit=1000)
    total_in = sum(
        Decimal(r["quantity"]) for r in rows if r.get("transaction_type") == "Entry"
    )
    total_out = sum(
        Decimal(r["quantity"]) for r in rows if r.get("transaction_type") == "Exit"
    )
    return StockTotals(total_in=total_in, total_out=total_out)


@router.get("/movements", response_model=list[StockTransactionRead])
def list_movements(
    warehouse_id: Optional[str] = None,
    product_id: Optional[str] = None,
    limit: int = Query(default=100, ge=1, le=500),
    company_id: str = Depends(get_company_id),
    client=Depends(get_user_client_dep),
):
    rows = _query_transactions(client, company_id, warehouse_id, product_id, limit=limit)
    return [StockTransactionRead.model_validate(r) for r in rows]


@router.post("/transactions", response_model=StockTransactionRead, status_code=201)
def create_transaction(
    payload: StockTransactionCreate,
    company_id: str = Depends(get_company_id),
    client=Depends(get_user_client_dep),
):
    """Stok hareketi (Giris / Cikis / Uretim) kaydeder. RLS korur."""
    repo = TableRepository(client, "stock_transactions")
    row = repo.create(payload.model_dump(mode="json"))
    return StockTransactionRead.model_validate(row)


def _query_transactions(
    client,
    company_id: str,
    warehouse_id: Optional[str],
    product_id: Optional[str],
    limit: int,
) -> list[dict]:
    """Stok hareketlerini depo uzerinden sirkete filtreleyerek doner.

    `stock_transactions` tablosunda dogrudan company_id yoktur; depo
    (warehouses.company_id) inner-join ile filtrelenir, RLS ayrica korur.
    """
    query = (
        client.table("stock_transactions")
        .select("*, warehouses!inner(company_id)")
        .eq("warehouses.company_id", company_id)
    )
    if warehouse_id:
        query = query.eq("warehouse_id", warehouse_id)
    if product_id:
        query = query.eq("product_id", product_id)
    return query.order("transaction_date", desc=True).limit(limit).execute().data