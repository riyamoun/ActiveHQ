"""
Application configuration using Pydantic Settings.
Environment variables are loaded from .env file.
"""

from functools import lru_cache
from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )
    
    # Application
    app_name: str = "ActiveHQ"
    app_version: str = "1.0.0"
    debug: bool = False
    environment: str = "development"  # development, staging, production
    
    # Database - raw URL from environment (may be postgres:// format)
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/activehq"
    db_echo: bool = False  # Log SQL queries (disable in production)
    
    @computed_field
    @property
    def database_url_sqlalchemy(self) -> str:
        """Get SQLAlchemy-compatible database URL (converts postgres:// to postgresql+psycopg://)."""
        import urllib.parse
        
        url = self.database_url.strip()
        
        # Debug: print URL scheme (safe to log)
        scheme = url.split("://")[0] if "://" in url else "unknown"
        print(f"[Config] Database URL scheme: {scheme}, length: {len(url)}")
        
        # Handle different postgres URL formats
        if url.startswith("postgres://"):
            url = "postgresql+psycopg://" + url[11:]
        elif url.startswith("postgresql://") and "+psycopg" not in url:
            url = "postgresql+psycopg://" + url[13:]
        
        # Try to parse and re-encode to handle special characters in password
        try:
            parsed = urllib.parse.urlparse(url)
            if parsed.password:
                # URL-encode the password to handle special characters
                encoded_password = urllib.parse.quote(parsed.password, safe='')
                # Reconstruct the URL with encoded password
                if parsed.port:
                    netloc = f"{parsed.username}:{encoded_password}@{parsed.hostname}:{parsed.port}"
                else:
                    netloc = f"{parsed.username}:{encoded_password}@{parsed.hostname}"
                url = urllib.parse.urlunparse((
                    parsed.scheme,
                    netloc,
                    parsed.path,
                    parsed.params,
                    parsed.query,
                    parsed.fragment
                ))
        except Exception as e:
            print(f"[Config] Warning: Could not parse/encode database URL: {e}")
        
        return url
    
    # JWT Authentication
    jwt_secret_key: str = "CHANGE-THIS-IN-PRODUCTION-USE-STRONG-SECRET"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15  # Production: short-lived access
    refresh_token_expire_days: int = 7
    
    # Security
    password_min_length: int = 8
    bcrypt_rounds: int = 12
    setup_database_key: str = ""
    sentry_dsn: str = ""
    sentry_traces_sample_rate: float = 0.1
    lead_webhook_url: str = ""
    
    # Picky Assist Push API — WhatsApp + SMS (single provider).
    # Token: Picky Assist → Project → API. Channel IDs: Settings → Channels.
    # https://help.pickyassist.com/api-documentation-v2/push-api/sending-single-message-push
    pickyassist_api_token: str = ""
    pickyassist_push_url: str = "https://app.pickyassist.com/api/v2/push"
    # WhatsApp: use your channel id (e.g. 8 Official, 101 Cloud API, 121 Official Managed)
    pickyassist_application_whatsapp: str = ""
    # SMS: 3 = SMS Phone Automation (unless your project uses another channel id)
    pickyassist_application_sms: str = "3"
    messaging_phone_number: str = "9958040484"
    
    # Cron: secret to call /api/v1/automation/run-cron (Render Cron or external scheduler)
    cron_secret: str = ""
    
    # Email (free: GoDaddy SMTP / Gmail app password). Optional; no cost per message.
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    
    # CORS - stored as comma-separated string, accessed as list via property
    cors_origins_str: str = "http://localhost:3000,http://localhost:5173"
    # Allows Vercel preview deployments and the production custom domain.
    # Examples: https://active-hq-git-feature-abc-hp.vercel.app, https://activehq.fit
    cors_allow_origin_regex: str = r"^https://((.*\.vercel\.app)|(www\.)?activehq\.fit)$"
    
    @computed_field
    @property
    def cors_origins(self) -> list[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.cors_origins_str.split(",") if origin.strip()]
    
    # Pagination defaults
    default_page_size: int = 20
    max_page_size: int = 100

    # Member portal (mobile-first app for gym members)
    # When set, magic-link emails point users back here; otherwise we fall
    # back to the request's Host header at runtime.
    member_portal_url: str = ""
    # Token lifetime for the member access token. Members are on phones and
    # rarely refresh, so we use a long-lived token (no refresh-token flow yet).
    member_access_token_expire_minutes: int = 60 * 24 * 14  # 14 days
    # WhatsApp / SMS OTP for member login
    member_otp_length: int = 6
    member_otp_expire_seconds: int = 5 * 60  # 5 minutes
    member_otp_max_attempts: int = 5
    # Magic-link email login
    member_magic_link_expire_seconds: int = 15 * 60  # 15 minutes
    # Google Identity Services — public client id. Same value in frontend env.
    google_oauth_client_id: str = ""

    # Gemini (AI Coach prose on /api/coach/plan). When empty, insights stay deterministic.
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()


settings = get_settings()
