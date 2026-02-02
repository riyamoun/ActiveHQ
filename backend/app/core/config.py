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
    access_token_expire_minutes: int = 60 * 24  # 24 hours
    refresh_token_expire_days: int = 30
    
    # Security
    password_min_length: int = 8
    bcrypt_rounds: int = 12
    
    # CORS - stored as comma-separated string, accessed as list via property
    cors_origins_str: str = "http://localhost:3000,http://localhost:5173"
    
    @computed_field
    @property
    def cors_origins(self) -> list[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.cors_origins_str.split(",") if origin.strip()]
    
    # Pagination defaults
    default_page_size: int = 20
    max_page_size: int = 100


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()


settings = get_settings()
