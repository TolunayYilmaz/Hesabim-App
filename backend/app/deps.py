"""Kimlik dogrulama ve sirket baglami (tenancy) dependency'leri."""
from dataclasses import dataclass, field
from typing import Optional
from uuid import UUID

import jwt as pyjwt
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings
from app.database import get_admin_client, get_user_client

security = HTTPBearer(auto_error=False)


@dataclass
class CurrentUser:
    id: str
    email: str
    full_name: str
    role: str
    token: str
    is_admin: bool = False


def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> CurrentUser:
    """Authorization header'daki Supabase JWT'yi dogrular ve kullanici profili doner."""
    if creds is None or not creds.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kimlik dogrulamasi gerekli.",
        )

    token = creds.credentials
    try:
        payload = _decode_token(token)
    except pyjwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Gecersiz veya suresi dolmus token.",
        )


_jwks_client: Optional["PyJWKClient"] = None


def _decode_token(token: str) -> dict:
    """JWT'yi once JWKS endpoint'inden, yoksa eski usul JWT Secret ile cozer."""
    global _jwks_client
    if settings.supabase_jwks_url:
        if _jwks_client is None:
            from jwt import PyJWKClient

            _jwks_client = PyJWKClient(settings.supabase_jwks_url)
        key = _jwks_client.get_signing_key_from_jwt(token)
        algorithms = ["HS256"] if isinstance(key.key, str) else ["RS256"]
        return pyjwt.decode(
            token,
            key.key,
            algorithms=algorithms,
            options={"verify_aud": False},
        )
    return pyjwt.decode(
        token,
        settings.supabase_jwt_secret,
        algorithms=["HS256"],
        options={"verify_aud": False},
    )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token icinde kullanici kimligi (sub) yok.",
        )

    admin = get_admin_client()
    res = (
        admin.table("users")
        .select("*")
        .eq("id", user_id)
        .maybe_single()
        .execute()
    )
    row = res.data
    if not row or not row.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kullanici bulunamadi veya devre disi.",
        )

    role = row.get("role", "user")
    return CurrentUser(
        id=str(row["id"]),
        email=row["email"],
        full_name=row.get("full_name", "") or "",
        role=role,
        token=token,
        is_admin=role == "admin",
    )


def get_user_client_dep(current: CurrentUser = Depends(get_current_user)):
    """Kullanicinin JWT'si ile scope'lanmis supabase istemcisi (RLS aktif)."""
    return get_user_client(current.token)


def get_company_id(
    x_company_id: str = Header(...),
) -> str:
    """Her istekte aktif sirket ID'si (X-Company-Id header) zorunludur."""
    if not x_company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-Company-Id header'i gerekli.",
        )
    try:
        UUID(x_company_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Gecersiz sirket ID formatı.",
        )
    return str(x_company_id)


def get_scoped_caller(
    client=Depends(get_user_client_dep),
    company_id: str = Depends(get_company_id),
    current: CurrentUser = Depends(get_current_user),
):
    """CRUD endpoint'leri icin hazir paket: (client, company_id, user)."""
    return {
        "client": client,
        "company_id": company_id,
        "user": current,
    }