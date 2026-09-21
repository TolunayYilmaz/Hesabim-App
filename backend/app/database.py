"""Supabase (postgREST) istemci ureticileri.

- `get_admin_client()`: service_role anahtari ile tam yetkili istemci.
  Kayit (register) ve sirket olusturma gibi RLS'nin disinda kalan
  islemler icin kullanilir.
- `get_user_client(token)`: Login olan kullanicinin JWT'sine bagli istemci.
  T�m CRUD islemleri bu istemci ile yapilir; RLS kurallari otomatik
  uygulanir (kullanici sadece kendi sirketinin verisini gorur).
"""
from functools import lru_cache
from typing import Optional

from supabase import Client, create_client

from app.config import settings


@lru_cache(maxsize=1)
def get_admin_client() -> Client:
    """Service role gerektiren islemler icin tekil (singleton) istemci."""
    if not settings.supabase_url or not settings.supabase_service_key:
        raise RuntimeError("SUPABASE_URL ve SUPABASE_SERVICE_KEY tanimli olmali.")
    return create_client(settings.supabase_url, settings.supabase_service_key)


def get_user_client(token: str) -> Client:
    """Kullanici JWT'si ile scope'lanmis istemci. RLS bu istemci uzerinden calisir."""
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise RuntimeError("SUPABASE_URL ve SUPABASE_ANON_KEY tanimli olmali.")
    return create_client(settings.supabase_url, settings.supabase_anon_key, access_token=token)


def get_client(token: Optional[str] = None) -> Client:
    if token:
        return get_user_client(token)
    return get_admin_client()