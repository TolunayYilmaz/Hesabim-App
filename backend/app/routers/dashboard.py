from datetime import date, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends

from app.deps import get_company_id, get_user_client_dep
from app.schemas.dashboard import DashboardSummary

router = APIRouter(prefix="/dashboard", tags=["Genel Gorunum"])


@router.get("/summary", response_model=DashboardSummary)
def summary(
    company_id: str = Depends(get_company_id),
    client=Depends(get_user_client_dep),
):
    """Genel gorunum icin KPI ozetleri (RPC ile tek seferde)."""
    res = client.rpc("get_dashboard_summary", {"p_company_id": company_id}).execute()
    return DashboardSummary(**res.data)


@router.get("/recent", response_model=dict)
def recent_activity(
    days: int = 30,
    company_id: str = Depends(get_company_id),
    client=Depends(get_user_client_dep),
):
    """Son hareketler: belgeler, finansal hareketler ve cek/senetler."""
    since = date.today() - timedelta(days=days)

    documents = client.table("documents").select("*") \
        .eq("company_id", company_id).gte("issue_date", str(since)) \
        .order("issue_date", desc=True).limit(10).execute().data

    financials = client.table("financial_transactions").select("*") \
        .eq("company_id", company_id).gte("transaction_date", str(since)) \
        .order("transaction_date", desc=True).limit(10).execute().data

    cheques = client.table("cheques_bonds").select("*") \
        .eq("company_id", company_id) \
        .order("due_date", desc=True).limit(10).execute().data

    return {
        "documents": documents,
        "financial_transactions": financials,
        "cheques_bonds": cheques,
    }