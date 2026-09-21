from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_admin_client
from app.deps import get_current_user, get_user_client_dep
from app.models.base import TableRepository
from app.schemas.company import (
    CompanyCreate,
    CompanyRead,
    CompanyUpdate,
    CompanyUserAdd,
    CompanyUserRead,
)

router = APIRouter(prefix="/companies", tags=["Companies"])


@router.get("/my", response_model=list[CompanyRead])
def my_companies(
    current=Depends(get_current_user),
    client=Depends(get_user_client_dep),
):
    """Aktif kullanicinin uye oldugu sirketler."""
    memberships = client.table("company_users").select("company_id").eq("user_id", current.id).execute().data
    ids = [m["company_id"] for m in memberships]
    if not ids:
        return []
    companies = client.table("companies").select("*").in_("id", ids).execute().data
    return [CompanyRead.model_validate(c) for c in companies]


@router.post("/", response_model=CompanyRead, status_code=status.HTTP_201_CREATED)
def create_company(
    payload: CompanyCreate,
    current=Depends(get_current_user),
):
    """Sirket olusturur ve kurucuyu admin olarak uye yapar.

    RLS'nin 'tavuk-yumurta' problemini asmak icin service role ile
    hem company hem company_users satiri acilir.
    """
    admin = get_admin_client()
    company = admin.table("companies").insert(payload.model_dump()).execute().data[0]
    admin.table("company_users").insert(
        {"company_id": company["id"], "user_id": current.id, "role": "admin"}
    ).execute()
    return CompanyRead.model_validate(company)


@router.get("/{company_id}", response_model=CompanyRead)
def get_company(
    company_id: UUID,
    current=Depends(get_current_user),
    client=Depends(get_user_client_dep),
):
    row = client.table("companies").select("*").eq("id", str(company_id)).maybe_single().execute().data
    if not row:
        raise HTTPException(status_code=404, detail="Sirket bulunamadi.")
    return CompanyRead.model_validate(row)


@router.patch("/{company_id}", response_model=CompanyRead)
def update_company(
    company_id: UUID,
    payload: CompanyUpdate,
    current=Depends(get_current_user),
    client=Depends(get_user_client_dep),
):
    data = payload.model_dump(exclude_unset=True)
    row = client.table("companies").update(data).eq("id", str(company_id)).execute().data
    if not row:
        raise HTTPException(status_code=404, detail="Sirket bulunamadi.")
    return CompanyRead.model_validate(row[0])


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_company(
    company_id: UUID,
    current=Depends(get_current_user),
    client=Depends(get_user_client_dep),
):
    row = client.table("companies").delete().eq("id", str(company_id)).execute().data
    if not row:
        raise HTTPException(status_code=404, detail="Sirket bulunamadi.")


@router.get("/{company_id}/users", response_model=list[CompanyUserRead])
def list_members(
    company_id: UUID,
    current=Depends(get_current_user),
    client=Depends(get_user_client_dep),
):
    res = (
        client.table("company_users")
        .select("company_id, user_id, role, created_at")
        .eq("company_id", str(company_id))
        .order("created_at")
        .execute()
    )
    return [CompanyUserRead.model_validate(r) for r in res.data]


@router.post("/{company_id}/users", response_model=CompanyUserRead, status_code=201)
def add_member(
    company_id: UUID,
    payload: CompanyUserAdd,
    current=Depends(get_current_user),
    client=Depends(get_user_client_dep),
):
    """Email'e sahip kullaniciyi sirkete ekler (sirket admin'i yetkilidir)."""
    admin = get_admin_client()
    target = (
        admin.table("users")
        .select("id")
        .eq("email", payload.email)
        .maybe_single()
        .execute()
        .data
    )
    if not target:
        raise HTTPException(status_code=404, detail="E-posta ile kullanici bulunamadi.")

    existing = (
        client.table("company_users")
        .select("*")
        .eq("company_id", str(company_id))
        .eq("user_id", target["id"])
        .maybe_single()
        .execute()
        .data
    )
    if existing:
        raise HTTPException(status_code=409, detail="Kullanici zaten uye.")

    row = (
        client.table("company_users")
        .insert({"company_id": str(company_id), "user_id": target["id"], "role": payload.role})
        .execute()
        .data[0]
    )
    return CompanyUserRead.model_validate(row)