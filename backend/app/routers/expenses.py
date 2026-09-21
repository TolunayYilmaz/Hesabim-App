"""Gider / Masraf ucu.

POST /api/expenses  -> masraf olusturur; "Odendi" ise kasa hareketi de acar
                      (finansal_islem trigger'i kasayi otomatik dusurur).
GET  /api/expenses  -> sirket bazinda liste (kasa adi ile zenginlestirilmis).
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.deps import get_company_id, get_user_client_dep
from app.schemas.expense import ExpenseCreate, ExpenseResponse, ExpenseUpdate

router = APIRouter(prefix="/expenses", tags=["Giderler & Masraflar"])


def _enrich_account_names(client, rows: list[dict]) -> list[dict]:
    """Satirlara bagli kasa/hesap adini ekler (tek sorgu ile)."""
    ids = {r.get("cash_account_id") for r in rows if r.get("cash_account_id")}
    lookup: dict[str, str] = {}
    if ids:
        accts = (
            client.table("cash_accounts")
            .select("id, name")
            .in_("id", list(ids))
            .execute()
            .data
        )
        lookup = {a["id"]: a.get("name", "") for a in accts}
    for r in rows:
        r["cash_account_name"] = lookup.get(r.get("cash_account_id")) or None
    return rows


@router.get("", response_model=list[ExpenseResponse])
def list_expenses(
    category: Optional[str] = None,
    is_recurring: Optional[bool] = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    company_id: str = Depends(get_company_id),
    client=Depends(get_user_client_dep),
):
    q = client.table("expenses").select("*").eq("company_id", company_id)
    if category:
        q = q.eq("category", category)
    if is_recurring is not None:
        q = q.eq("is_recurring", is_recurring)
    rows = (
        q.order("expense_date", desc=True)
        .order("created_at", desc=True)
        .limit(limit)
        .offset(offset)
        .execute()
        .data
    )
    return [
        ExpenseResponse.model_validate(r)
        for r in _enrich_account_names(client, rows)
    ]


@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    payload: ExpenseCreate,
    company_id: str = Depends(get_company_id),
    client=Depends(get_user_client_dep),
):
    # Noktasal degerlerin (Decimal/date) tam precision ile aktarilmasi:
    data: dict = {
        "company_id": company_id,
        "expense_date": str(payload.expense_date),
        "document_no": payload.document_no,
        "payment_date": str(payload.payment_date) if payload.payment_date else None,
        "amount": str(payload.amount),
        "is_recurring": payload.is_recurring,
        "category": payload.category,
        "payment_status": payload.payment_status,
        "cash_account_id": (
            str(payload.cash_account_id) if payload.cash_account_id else None
        ),
        "tax_rate": str(payload.tax_rate),
        "description": payload.description,
    }

    exp = client.table("expenses").insert(data).execute().data[0]

    # "Odendi" secildiyse kasadan odeme finansal hareketi ac (kasa dusmesi trigger'dan).
    paid = payload.payment_status == "Odendi"
    if paid and payload.cash_account_id:
        client.table("financial_transactions").insert(
            {
                "company_id": company_id,
                "cash_account_id": str(payload.cash_account_id),
                "amount": str(payload.amount),
                "transaction_date": str(
                    payload.payment_date or payload.expense_date
                ),
                "transaction_type": "Masraf",
                "description": payload.description
                or f"Masraf - {payload.category or 'Genel'}",
            }
        ).execute()

    return ExpenseResponse.model_validate(
        _enrich_account_names(client, [exp])[0]
    )


@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(
    expense_id: str,
    company_id: str = Depends(get_company_id),
    client=Depends(get_user_client_dep),
):
    row = (
        client.table("expenses")
        .select("*")
        .eq("id", expense_id)
        .eq("company_id", company_id)
        .maybe_single()
        .execute()
        .data
    )
    if not row:
        raise HTTPException(status_code=404, detail="Masraf bulunamadi.")
    return ExpenseResponse.model_validate(_enrich_account_names(client, [row])[0])


@router.patch("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: str,
    payload: ExpenseUpdate,
    company_id: str = Depends(get_company_id),
    client=Depends(get_user_client_dep),
):
    data = payload.model_dump(exclude_unset=True)
    if "amount" in data:
        data["amount"] = str(data["amount"])
    if "tax_rate" in data:
        data["tax_rate"] = str(data["tax_rate"])
    if data.get("payment_date"):
        data["payment_date"] = str(data["payment_date"])
    if data.get("expense_date"):
        data["expense_date"] = str(data["expense_date"])
    if data.get("cash_account_id"):
        data["cash_account_id"] = str(data["cash_account_id"])

    rows = (
        client.table("expenses")
        .update(data)
        .eq("id", expense_id)
        .eq("company_id", company_id)
        .execute()
        .data
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Masraf bulunamadi.")
    return ExpenseResponse.model_validate(_enrich_account_names(client, rows)[0])


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: str,
    company_id: str = Depends(get_company_id),
    client=Depends(get_user_client_dep),
):
    rows = (
        client.table("expenses")
        .delete()
        .eq("id", expense_id)
        .eq("company_id", company_id)
        .execute()
        .data
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Masraf bulunamadi.")