from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings as app_settings
from app.routers import (
    assets,
    auth,
    cash_accounts,
    cheques_bonds,
    companies,
    credits,
    dashboard,
    documents,
    expenses,
    financial_transactions,
    identities,
    products,
    productions,
    projects,
    reports,
    settings,
    stock,
    variants,
    warehouses,
)

app = FastAPI(
    title=app_settings.app_name,
    version="0.1.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=app_settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API = app_settings.api_prefix

app.include_router(auth.router, prefix=API)
app.include_router(companies.router, prefix=API)
app.include_router(identities.router, prefix=API)
app.include_router(identities.extra_router, prefix=API)
app.include_router(products.router, prefix=API)
app.include_router(warehouses.router, prefix=API)
app.include_router(variants.router, prefix=API)
app.include_router(productions.router, prefix=API)
app.include_router(stock.router, prefix=API)
app.include_router(cash_accounts.router, prefix=API)
app.include_router(documents.router, prefix=API)
app.include_router(cheques_bonds.router, prefix=API)
app.include_router(expenses.router, prefix=API)
app.include_router(financial_transactions.router, prefix=API)
app.include_router(assets.router, prefix=API)
app.include_router(projects.router, prefix=API)
app.include_router(credits.router, prefix=API)
app.include_router(reports.router, prefix=API)
app.include_router(settings.router, prefix=API)
app.include_router(dashboard.router, prefix=API)


@app.get("/", tags=["Health"])
def root():
    return {"app": app_settings.app_name, "docs": "/api/docs"}


@app.get("/api/health", tags=["Health"])
def health():
    return {"status": "ok"}