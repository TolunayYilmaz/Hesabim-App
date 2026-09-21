from app.crud import build_crud_router
from app.schemas.asset import AssetCreate, AssetRead, AssetUpdate

router = build_crud_router(
    table="assets",
    read_schema=AssetRead,
    create_schema=AssetCreate,
    update_schema=AssetUpdate,
    prefix="/assets",
    tag="Demirbaslar",
)