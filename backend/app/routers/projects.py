from app.crud import build_crud_router
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate

router = build_crud_router(
    table="projects",
    read_schema=ProjectRead,
    create_schema=ProjectCreate,
    update_schema=ProjectUpdate,
    prefix="/projects",
    tag="Projeler",
)