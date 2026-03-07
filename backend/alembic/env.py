"""
Alembic migration environment configuration.
"""

from logging.config import fileConfig

from sqlalchemy import pool

from alembic import context

# Import our models and config
from app.core.config import settings
from app.core.base import Base
from app.models import (  # noqa: F401 - imported for side effects (model registration)
    Gym,
    User,
    Member,
    Plan,
    Membership,
    Payment,
    Attendance,
    Notification,
    RefreshToken,
    AuditLog,
)

# this is the Alembic Config object
config = context.config

# Override sqlalchemy.url with our settings (use same URL as app: postgresql+psycopg)
config.set_main_option("sqlalchemy.url", settings.database_url_sqlalchemy)

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Model metadata for autogenerate support
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """
    Run migrations in 'offline' mode.
    
    This configures the context with just a URL and not an Engine.
    Calls to context.execute() emit the given string to the script output.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """
    Run migrations in 'online' mode.
    
    Create an Engine and associate a connection with the context.
    Use settings.database_url_sqlalchemy so we use postgresql+psycopg (psycopg3), not psycopg2.
    """
    from sqlalchemy import create_engine
    connectable = create_engine(
        settings.database_url_sqlalchemy,
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
