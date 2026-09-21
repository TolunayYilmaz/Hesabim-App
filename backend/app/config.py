from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Hesabım API"
    api_prefix: str = "/api"
    debug: bool = False

    # Firma: hem NEXT_PUBLIC_SUPABASE_URL (Vercel ortak sekmesi) hem de
    # SUPABASE_URL (eski ad) desteklenir.
    supabase_url: str = Field(
        default="",
        validation_alias=AliasChoices("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"),
    )
    supabase_anon_key: str = Field(
        default="",
        validation_alias=AliasChoices(
            "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY"
        ),
    )
    # Service role anahtari YALNIZCA backend tarafinda (asla frontend'e acilmaz).
    supabase_service_key: str = Field(
        default="",
        validation_alias=AliasChoices("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_KEY"),
    )
    # JWT dogrulama: oncelik JWKS endpoint'inde; yoksa eski usul JWT Secret (HS256).
    supabase_jwks_url: str = ""
    supabase_jwt_secret: str = ""

    # Virgulle ayrilmis CORS origin listesi
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()