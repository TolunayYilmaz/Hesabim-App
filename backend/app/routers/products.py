from app.crud import build_crud_router
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate

router = build_crud_router(
    table="products",
    read_schema=ProductRead,
    create_schema=ProductCreate,
    update_schema=ProductUpdate,
    prefix="/products",
    tag="Urunler / Stok Kartlari",
)