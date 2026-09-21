from app.crud import build_crud_router
from app.schemas.warehouse import WarehouseCreate, WarehouseRead, WarehouseUpdate

router = build_crud_router(
    table="warehouses",
    read_schema=WarehouseRead,
    create_schema=WarehouseCreate,
    update_schema=WarehouseUpdate,
    prefix="/warehouses",
    tag="Depolar",
)