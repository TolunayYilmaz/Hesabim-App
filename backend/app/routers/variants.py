from app.crud import build_crud_router
from app.schemas.variant import VariantCreate, VariantRead, VariantUpdate

router = build_crud_router(
    table="product_variants",
    read_schema=VariantRead,
    create_schema=VariantCreate,
    update_schema=VariantUpdate,
    prefix="/variants",
    tag="Varyantlar",
)