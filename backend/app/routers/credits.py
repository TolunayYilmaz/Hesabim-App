from app.crud import build_crud_router
from app.schemas.credit import CreditCreate, CreditRead, CreditUpdate

router = build_crud_router(
    table="credits",
    read_schema=CreditRead,
    create_schema=CreditCreate,
    update_schema=CreditUpdate,
    prefix="/credits",
    tag="Krediler",
)