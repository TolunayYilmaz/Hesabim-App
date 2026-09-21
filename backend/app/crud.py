"""Jenerik (generic) CRUD router fabrikasi."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.deps import get_company_id, get_user_client_dep
from app.models.base import TableRepository


def build_crud_router(
    *,
    table: str,
    read_schema: type,
    create_schema: type,
    update_schema: type,
    prefix: str,
    tag: str,
    company_scoped: bool = True,
) -> APIRouter:
    """Standart list/olustur/detay/guncelle/sil uclu bir router uretir.

    T�m islemler kullanicinin JWT'sine bagli istemci ile yapildigindan
    RLS (satir duzeyi guvenlik) otomatik olarak uygulanir.
    """
    router = APIRouter(prefix=prefix, tags=[tag])
    list_type = list[read_schema]

    @router.get("/", response_model=list_type)
    def list_items(
        company_id: Optional[str] = Depends(get_company_id) if company_scoped else None,
        client=Depends(get_user_client_dep),
        limit: int = Query(default=100, ge=1, le=500),
        offset: int = Query(default=0, ge=0),
        order: str = Query(default="created_at"),
    ):
        repo = TableRepository(client, table, company_scoped=company_scoped)
        return repo.list(company_id=company_id, limit=limit, offset=offset, order=order)

    @router.post("/", response_model=read_schema, status_code=201)
    def create_item(
        payload: create_schema,  # type: ignore[valid-type]
        company_id: Optional[str] = Depends(get_company_id) if company_scoped else None,
        client=Depends(get_user_client_dep),
    ):
        data = payload.model_dump(exclude_unset=True, mode="json")
        if company_scoped:
            data["company_id"] = company_id
        repo = TableRepository(client, table, company_scoped=company_scoped)
        return repo.create(data)

    @router.get("/{item_id}", response_model=read_schema)
    def get_item(
        item_id: str,
        company_id: Optional[str] = Depends(get_company_id) if company_scoped else None,
        client=Depends(get_user_client_dep),
    ):
        repo = TableRepository(client, table, company_scoped=company_scoped)
        row = repo.get(item_id)
        if not row:
            raise HTTPException(status_code=404, detail="Kayit bulunamadi.")
        return row

    @router.patch("/{item_id}", response_model=read_schema)
    def update_item(
        item_id: str,
        payload: update_schema,  # type: ignore[valid-type]
        company_id: Optional[str] = Depends(get_company_id) if company_scoped else None,
        client=Depends(get_user_client_dep),
    ):
        repo = TableRepository(client, table, company_scoped=company_scoped)
        row = repo.get(item_id)
        if not row:
            raise HTTPException(status_code=404, detail="Kayit bulunamadi.")
        data = payload.model_dump(exclude_unset=True, mode="json")
        return repo.update(item_id, data)

    @router.delete("/{item_id}", status_code=204)
    def delete_item(
        item_id: str,
        company_id: Optional[str] = Depends(get_company_id) if company_scoped else None,
        client=Depends(get_user_client_dep),
    ):
        repo = TableRepository(client, table, company_scoped=company_scoped)
        if not repo.delete(item_id):
            raise HTTPException(status_code=404, detail="Kayit bulunamadi.")

    return router