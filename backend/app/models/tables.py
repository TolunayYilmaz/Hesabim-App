"""Supabase tablo kayitlari (veritabani tablo adlari)."""
from dataclasses import dataclass


@dataclass(frozen=True)
class Entity:
    """Bir veritabani tablosunun meta bilgisi."""

    table: str
    pk: str = "id"
    company_scoped: bool = True


TABLES: dict[str, Entity] = {
    "users": Entity(table="users", company_scoped=False),
    "companies": Entity(table="companies", company_scoped=False),
    "company_users": Entity(table="company_users", company_scoped=False),
    "identities": Entity(table="identities"),
    "warehouses": Entity(table="warehouses"),
    "products": Entity(table="products"),
    "stock_transactions": Entity(table="stock_transactions"),
    "cash_accounts": Entity(table="cash_accounts"),
    "documents": Entity(table="documents"),
    "document_items": Entity(table="document_items"),
    "financial_transactions": Entity(table="financial_transactions"),
    "cheques_bonds": Entity(table="cheques_bonds"),
    "expenses": Entity(table="expenses"),
    "assets": Entity(table="assets"),
    "projects": Entity(table="projects"),
    "credits": Entity(table="credits"),
    "product_variants": Entity(table="product_variants"),
    "productions": Entity(table="productions"),
}