import secrets
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status

from app.deps import get_company_id, get_user_client_dep
from app.schemas.settings import ApiKeyResponse, FirmSettingsRead, FirmSettingsUpdate

router = APIRouter(prefix="/settings", tags=["Firma / Sistem Ayarlari"])


def _row_to_settings(row: dict) -> FirmSettingsRead:
    return FirmSettingsRead(
        **row,
        has_api_key=bool(row.get("api_key")),
    )


@router.get("/", response_model=FirmSettingsRead)
def get_settings(
    company_id: str = Depends(get_company_id),
    client=Depends(get_user_client_dep),
):
    """Aktif sirketin firma ayarlarini getirir."""
    row = (
        client.table("companies")
        .select("*")
        .eq("id", company_id)
        .maybe_single()
        .execute()
        .data
    )
    if not row:
        raise HTTPException(status_code=404, detail="Sirket bulunamadi.")
    return _row_to_settings(row)


@router.put("/", response_model=FirmSettingsRead)
def update_settings(
    payload: FirmSettingsUpdate,
    company_id: str = Depends(get_company_id),
    client=Depends(get_user_client_dep),
):
    """Firma ayarlarini (baslik, telefon, adres, banka bilgileri...) gunceller."""
    data = payload.model_dump(exclude_unset=True)
    rows = client.table("companies").update(data).eq("id", company_id).execute().data
    if not rows:
        raise HTTPException(status_code=404, detail="Sirket bulunamadi.")
    return _row_to_settings(rows[0])


@router.post("/api-key", response_model=ApiKeyResponse)
def generate_api_key(
    company_id: str = Depends(get_company_id),
    client=Depends(get_user_client_dep),
):
    """Yeni bir API key uretir ve sirkete kaydeder.

    Key yalnizca bu yanitta gosterilir; daha sonra gizlenir.
    """
    key = f"bh-{secrets.token_hex(24)}"
    rows = (
        client.table("companies")
        .update({"api_key": key, "updated_at": datetime.utcnow().isoformat()})
        .eq("id", company_id)
        .execute()
        .data
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Sirket bulunamadi.")
    return ApiKeyResponse(api_key=key)