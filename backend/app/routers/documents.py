from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.deps import get_company_id, get_user_client_dep
from app.schemas.document import (
    DocumentCreate,
    DocumentFull,
    DocumentItemRead,
    DocumentRead,
    DocumentUpdate,
)


def _compute_total(items: list[dict]) -> Decimal:
    total = Decimal("0")
    for it in items:
        qty = Decimal(str(it.get("quantity", 0)))
        price = Decimal(str(it.get("unit_price", 0)))
        discount = Decimal(str(it.get("discount", 0)))
        tax = Decimal(str(it.get("tax_rate", 0)))
        net = qty * price - discount
        total += net + net * tax / 100
    return total


router = APIRouter(prefix="/documents", tags=["Belgeler"])


@router.get("", response_model=list[DocumentRead])
def list_documents(
    doc_type: Optional[str] = None,
    status_filter: Optional[str] = Query(default=None, alias="status"),
    limit: int = Query(default=100, ge=1, le=500),
    company_id: str = Depends(get_company_id),
    client=Depends(get_user_client_dep),
):
    q = client.table("documents").select("*").eq("company_id", company_id)
    if doc_type:
        q = q.eq("doc_type", doc_type)
    if status_filter:
        q = q.eq("status", status_filter)
    rows = q.order("issue_date", desc=True).limit(limit).execute().data
    return [DocumentRead.model_validate(r) for r in rows]


@router.post("", response_model=DocumentRead, status_code=status.HTTP_201_CREATED)
def create_document(
    payload: DocumentCreate,
    company_id: str = Depends(get_company_id),
    client=Depends(get_user_client_dep),
):
    """Belgeyi kalemleriyle TEK TRANSACTION'DA olusturur (atomik RPC).

    Baslik veya kalemlerden biri basarisiz olursa hicbiri kaydedilmez.
    Yanit: kaydedilen belge basligi (kalemler /api/documents/{id}/items ile okunur).
    """
    items_payload = [it.model_dump(mode="json") for it in payload.items]
    doc_payload = payload.model_dump(exclude={"items"}, mode="json")
    doc_payload["company_id"] = company_id
    doc_payload["total_amount"] = str(_compute_total(items_payload))

    try:
        rpc_result = client.rpc(
            "create_document_with_items",
            {"p_document": doc_payload, "p_items": items_payload},
        ).execute()
    except Exception:
        raise HTTPException(
            status_code=409,
            detail="Belge olusturulamadi (belge numarasi zaten kayitli olabilir).",
        )

    doc = dict(rpc_result.data)
    doc["items"] = []
    return DocumentRead.model_validate(doc)


@router.get("/{document_id}", response_model=DocumentFull)
def get_document(
    document_id: str,
    company_id: str = Depends(get_company_id),
    client=Depends(get_user_client_dep),
):
    doc = (
        client.table("documents")
        .select("*")
        .eq("id", document_id)
        .eq("company_id", company_id)
        .maybe_single()
        .execute()
        .data
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Belge bulunamadi.")

    items = (
        client.table("document_items")
        .select("*")
        .eq("document_id", document_id)
        .order("id")
        .execute()
        .data
    )
    doc["items"] = items
    return DocumentFull.model_validate(doc)


@router.patch("/{document_id}", response_model=DocumentRead)
def update_document(
    document_id: str,
    payload: DocumentUpdate,
    company_id: str = Depends(get_company_id),
    client=Depends(get_user_client_dep),
):
    data = payload.model_dump(exclude_unset=True)
    row = (
        client.table("documents")
        .update(data)
        .eq("id", document_id)
        .eq("company_id", company_id)
        .execute()
        .data
    )
    if not row:
        raise HTTPException(status_code=404, detail="Belge bulunamadi.")
    return DocumentRead.model_validate(row[0])


@router.get("/{document_id}/items", response_model=list[DocumentItemRead])
def list_document_items(
    document_id: str,
    company_id: str = Depends(get_company_id),
    client=Depends(get_user_client_dep),
):
    """Bir belgenin kalemlerini listeler (RLS sirket kapsamini dogrular)."""
    rows = (
        client.table("document_items")
        .select("*")
        .eq("document_id", document_id)
        .order("id")
        .execute()
        .data
    )
    return [DocumentItemRead.model_validate(r) for r in rows]


@router.post("/{document_id}/items", response_model=DocumentItemRead, status_code=201)
def add_item(
    document_id: str,
    payload: dict,
    company_id: str = Depends(get_company_id),
    client=Depends(get_user_client_dep),
):
    from app.schemas.document import DocumentItemCreate

    item = DocumentItemCreate(**payload)
    row = (
        client.table("document_items")
        .insert({"document_id": document_id, **item.model_dump(mode="json")})
        .execute()
        .data[0]
    )
    return DocumentItemRead.model_validate(row)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: str,
    company_id: str = Depends(get_company_id),
    client=Depends(get_user_client_dep),
):
    row = (
        client.table("documents")
        .delete()
        .eq("id", document_id)
        .eq("company_id", company_id)
        .execute()
        .data
    )
    if not row:
        raise HTTPException(status_code=404, detail="Belge bulunamadi.")