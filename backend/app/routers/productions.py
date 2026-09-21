from app.crud import build_crud_router
from app.schemas.production import ProductionCreate, ProductionRead, ProductionUpdate

router = build_crud_router(
    table="productions",
    read_schema=ProductionRead,
    create_schema=ProductionCreate,
    update_schema=ProductionUpdate,
    prefix="/production",
    tag="Uretim",
)