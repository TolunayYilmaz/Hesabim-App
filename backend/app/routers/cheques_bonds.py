from app.crud import build_crud_router
from app.schemas.cheques_bonds import (
    ChequeBondCreate,
    ChequeBondRead,
    ChequeBondUpdate,
)

router = build_crud_router(
    table="cheques_bonds",
    read_schema=ChequeBondRead,
    create_schema=ChequeBondCreate,
    update_schema=ChequeBondUpdate,
    prefix="/cheques-bonds",
    tag="Cek / Senet",
)