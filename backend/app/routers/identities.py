from fastapi import APIRouter, Depends

from app.crud import build_crud_router
from app.deps import get_company_id, get_user_client_dep
from app.schemas.identity import IdentityCreate, IdentityRead, IdentityUpdate
from app.schemas.common import ORMModel

router = build_crud_router(
    table="identities",
    read_schema=IdentityRead,
    create_schema=IdentityCreate,
    update_schema=IdentityUpdate,
    prefix="/identities",
    tag="Cariler (Musteri / Tedarikci)",
)

extra_router = APIRouter(prefix="/identities", tags=["Cariler (Musteri / Tedarikci)"])


@extra_router.get(
    "/by-type/{identity_type}",
    response_model=list[IdentityRead],
)
def list_by_type(
    identity_type: str,
    company_id: str = Depends(get_company_id),
    client=Depends(get_user_client_dep),
):
    """Tur bazli cari listesi: Customer / Supplier."""
    rows = (
        client.table("identities")
        .select("*")
        .eq("company_id", company_id)
        .eq("identity_type", identity_type)
        .order("name")
        .execute()
        .data
    )
    return [IdentityRead.model_validate(r) for r in rows]