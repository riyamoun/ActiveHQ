"""
Logging utilities for the application.
Provides structured logging with JSON format for production and human-readable for development.
"""

import json
import logging
import sys
from functools import lru_cache
from typing import Any, Optional
from datetime import datetime


class StructuredFormatter(logging.Formatter):
    """JSON formatter for structured logging."""
    
    def __init__(self, use_json: bool = False):
        self.use_json = use_json
        super().__init__()
    
    def format(self, record: logging.LogRecord) -> str:
        if self.use_json:
            log_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "level": record.levelname,
                "logger": record.name,
                "message": record.getMessage(),
                "module": record.module,
            }
            
            # Add exception info if present
            if record.exc_info:
                log_data["exception"] = self.formatException(record.exc_info)
            
            # Add extra context from LogRecord
            for key, value in record.__dict__.items():
                if key not in ("name", "msg", "args", "exc_info", "exc_text", "created", 
                              "filename", "funcName", "levelname", "lineno", "module", 
                              "msecs", "message", "pathname", "process", "processName", 
                              "relativeCreated", "thread", "threadName", "getMessage"):
                    log_data[key] = value
            
            return json.dumps(log_data)
        else:
            # Development format
            return (
                f"{record.asctime} | {record.levelname:8} | "
                f"{record.name}:{record.lineno} | {record.getMessage()}"
            )


logger = logging.getLogger("activehq")


@lru_cache(maxsize=1)
def get_logger(use_json: bool = False):
    """Get application logger instance."""
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = StructuredFormatter(use_json=use_json)
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger


def log_info(message: str, **context: Any) -> None:
    """Log info level message with structured context."""
    log = get_logger()
    if context:
        extra = {"context": context}
        log.info(message, extra=extra)
    else:
        log.info(message)


def log_warning(message: str, **context: Any) -> None:
    """Log warning level message."""
    log = get_logger()
    if context:
        extra = {"context": context}
        log.warning(message, extra=extra)
    else:
        log.warning(message)


def log_error(
    message: str,
    error: Optional[Exception] = None,
    **context: Any
) -> None:
    """Log error level message with exception details."""
    log = get_logger()
    extra = {"context": context} if context else {}
    if error:
        extra["error_type"] = type(error).__name__
        extra["error_message"] = str(error)
        log.error(message, extra=extra, exc_info=True)
    else:
        log.error(message, extra=extra)


def log_debug(message: str, **context: Any) -> None:
    """Log debug level message."""
    log = get_logger()
    if context:
        extra = {"context": context}
        log.debug(message, extra=extra)
    else:
        log.debug(message)


def log_api_request(
    method: str,
    path: str,
    user_id: Optional[str] = None,
    gym_id: Optional[str] = None,
    **context: Any
) -> None:
    """Log API request."""
    log = get_logger()
    extra = {
        "request_method": method,
        "request_path": path,
        "user_id": user_id,
        "gym_id": gym_id,
        **context,
    }
    log.info(f"API Request: {method} {path}", extra=extra)


def log_api_response(
    method: str,
    path: str,
    status_code: int,
    duration_ms: float,
    **context: Any
) -> None:
    """Log API response."""
    log = get_logger()
    extra = {
        "response_status": status_code,
        "response_duration_ms": duration_ms,
        **context,
    }
    log.info(f"API Response: {method} {path} {status_code}", extra=extra)


__all__ = [
    "get_logger",
    "log_info",
    "log_warning",
    "log_error",
    "log_debug",
    "log_api_request",
    "log_api_response",
]
