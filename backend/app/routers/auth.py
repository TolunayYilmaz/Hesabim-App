from fastapi import APIRouter, Depends, HTTPException, status

from app.deps import get_current_user
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserRead,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest):
    """Supabase auth kullanicisi olusturur ve public.users kaydini actir."""
    from app.database import get_admin_client

    admin = get_admin_client()
    response = admin.auth.sign_up({"email": payload.email, "password": payload.password})
    auth_user = response.user
    if not auth_user:
        raise HTTPException(status_code=400, detail="Kayit islemi basarisiz.")

    profile = {
        "id": auth_user.id,
        "email": auth_user.email,
        "full_name": payload.full_name,
        "role": "user",
        "is_active": True,
    }
    # Service role ile eklenir; RLS'ye takilmaz (kendi kaydinin sahibi olur).
    admin.table("users").insert(profile).execute()

    session = response.session
    if session:
        res = (
            admin.table("users")
            .select("*")
            .eq("id", auth_user.id)
            .maybe_single()
            .execute()
        )
        return TokenResponse(
            access_token=session.access_token,
            refresh_token=session.refresh_token,
            user=UserRead.model_validate(res.data),
        )

    # Email dogrulama kapali degilse: kullanici henuz token alamaz.
    raise HTTPException(
        status_code=202,
        detail="Kayit alindi. Email dogrulamasi yapildiktan sonra giris yapin.",
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    """Email + sifre ile giris yapar ve JWT doner."""
    from app.database import get_admin_client

    admin = get_admin_client()
    try:
        response = admin.auth.sign_in_with_password(
            {"email": payload.email, "password": payload.password}
        )
    except Exception as exc:  # supabase 401'i exception olarak firlatir
        raise HTTPException(status_code=401, detail="Email veya sifre hatali.") from exc

    auth_user = response.user
    if not auth_user:
        raise HTTPException(status_code=401, detail="Giris basarisiz.")

    res = (
        admin.table("users")
        .select("*")
        .eq("id", auth_user.id)
        .maybe_single()
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=403, detail="Kullanici profili bulunamadi.")

    return TokenResponse(
        access_token=response.session.access_token,
        refresh_token=response.session.refresh_token,
        user=UserRead.model_validate(res.data),
    )


@router.get("/me", response_model=UserRead)
def me(current: dict = Depends(get_current_user)):
    return UserRead(
        id=current.id,
        email=current.email,
        full_name=current.full_name,
        role=current.role,
        is_active=True,
    )


@router.post("/logout")
def logout():
    """Supabase session imha eder. (Skelet: client-side token silme yeterlidir.)"""
    from app.database import get_admin_client

    try:
        get_admin_client().auth.sign_out()
    except Exception:
        pass
    return {"status": "ok"}


@router.post("/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest):
    from app.database import get_admin_client

    admin = get_admin_client()
    try:
        session = admin.auth.refresh_session(payload.refresh_token).session
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Refresh token gecersiz.") from exc
    if not session or not session.access_token:
        raise HTTPException(status_code=401, detail="Refresh token gecersiz.")
    return TokenResponse(
        access_token=session.access_token,
        refresh_token=session.refresh_token,
        user=None,
    )