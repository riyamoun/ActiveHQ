"""
Logging utilities for the application.
Provides structured logging with appropriate severity levels.
"""

import logging
from functools import lru_cache
from typing import Any

logger = logging.getLogger("activehq")


@lru_cache(maxsize=1)
def get_logger():
    """Get application logger instance."""
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger


def log_info(message: str, **context: Any) -> None:
    """Log info level message."""
    log = get_logger()
    if context:
        log.info(f"{message} | context: {context}")
    else:
        log.info(message)


def log_warning(message: str, **context: Any) -> None:
    """Log warning level message."""
    log = get_logger()
    if context:
        log.warning(f"{message} | context: {context}")
    else:
        log.warning(message)


def log_error(message: str, error: Exception | None = None, **context: Any) -> None:
    """Log error level message."""
    log = get_logger()
    error_msg = message
    if error:
        error_msg = f"{message} | error: {str(error)}"
    if context:
        error_msg = f"{error_msg} | context: {context}"
    log.error(error_msg, exc_info=error is not None)


def log_debug(message: str, **context: Any) -> None:
    """Log debug level message."""
    log = get_logger()
    if context:
        log.debug(f"{message} | context: {context}")
    else:
        log.debug(message)


__all__ = ["get_logger", "log_info", "log_warning", "log_error", "log_debug"]
