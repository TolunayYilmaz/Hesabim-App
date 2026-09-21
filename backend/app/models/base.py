"""Supabase (postgREST) uzerinde calisan hafif bir repository katmani.

Bu katman ORM degildir; supabase-python istemcisini sarmalayarak
KRUD islemlerini sirket (tenancy) baglaminda standartlastirir.
"""
from typing import Any, Optional

from supabase import Client


class TableRepository:
    def __init__(self, client: Client, table: str, company_scoped: bool = True):
        self._client = client
        self._table = table
        self._company_scoped = company_scoped

    def list(
        self,
        company_id: Optional[str] = None,
        filters: Optional[dict[str, Any]] = None,
        order: str = "created_at",
        desc: bool = True,
        limit: int = 100,
        offset: int = 0,
        range_min: Optional[int] = None,
        range_max: Optional[int] = None,
    ) -> list[dict]:
        query = self._client.table(self._table).select("*")
        if self._company_scoped and company_id:
            query = query.eq("company_id", company_id)
        for col, val in (filters or {}).items():
            query = query.eq(col, val)
        query = query.order(order, desc=desc)
        if range_min is not None and range_max is not None:
            query = query.range(range_min, range_max)
        elif limit is not None:
            query = query.limit(limit).offset(offset)
        return query.execute().data

    def get(self, pk_value: str) -> Optional[dict]:
        res = (
            self._client.table(self._table)
            .select("*")
            .eq(self._entity_pk(), pk_value)
            .maybe_single()
            .execute()
        )
        return res.data

    def create(self, data: dict) -> dict:
        res = self._client.table(self._table).insert(data).execute()
        return res.data[0] if res.data else {}

    def update(self, pk_value: str, data: dict) -> Optional[dict]:
        if not data:
            return self.get(pk_value)
        res = (
            self._client.table(self._table)
            .update(data)
            .eq(self._entity_pk(), pk_value)
            .execute()
        )
        return res.data[0] if res.data else None

    def delete(self, pk_value: str) -> bool:
        res = (
            self._client.table(self._table)
            .delete()
            .eq(self._entity_pk(), pk_value)
            .execute()
        )
        return bool(res.data)

    def count(self, company_id: Optional[str] = None, filters: Optional[dict] = None) -> int:
        query = self._client.table(self._table).select("id", count="exact")
        if self._company_scoped and company_id:
            query = query.eq("company_id", company_id)
        for col, val in (filters or {}).items():
            query = query.eq(col, val)
        res = query.execute()
        return res.count or 0

    def _entity_pk(self) -> str:
        return "id"