"""
Data import service supporting CSV and JSON formats.
Handles bulk import of members, plans, memberships, payments, and attendance.
"""

import csv
import io
import json
from datetime import datetime
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field

from app.core.logger import logger


class ImportFormat(str, Enum):
    """Supported import formats."""
    CSV = "csv"
    JSON = "json"


class ImportError(Exception):
    """Import-specific error."""
    pass


class MemberImportRecord(BaseModel):
    """Schema for member import record."""
    name: str
    phone: str
    email: Optional[str] = None
    date_of_birth: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    membership_type: Optional[str] = None
    start_date: Optional[str] = None
    notes: Optional[str] = None


class PaymentImportRecord(BaseModel):
    """Schema for payment import record."""
    member_phone: str
    amount: float
    payment_method: str  # "cash", "upi", "card"
    payment_date: str
    notes: Optional[str] = None
    transaction_id: Optional[str] = None


class AttendanceImportRecord(BaseModel):
    """Schema for attendance import record."""
    member_phone: str
    check_in_time: str  # ISO format or "2025-04-06 10:30:00"
    check_out_time: Optional[str] = None


class ImportResult(BaseModel):
    """Result of import operation."""
    total_records: int
    successful: int
    failed: int
    errors: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class DataImportService:
    """Service for importing data from CSV and JSON files."""

    def __init__(self):
        self.max_records = 10000
        self.max_file_size_mb = 50

    def detect_format(self, file_content: bytes, filename: str) -> ImportFormat:
        """Detect import format from filename and content."""
        filename_lower = filename.lower()

        if filename_lower.endswith(".json"):
            return ImportFormat.JSON

        if filename_lower.endswith(".csv"):
            return ImportFormat.CSV

        # Try to detect by content
        try:
            json.loads(file_content.decode("utf-8"))
            return ImportFormat.JSON
        except json.JSONDecodeError:
            pass

        try:
            file_content.decode("utf-8").strip().split("\n")[0]
            return ImportFormat.CSV
        except Exception:
            pass

        raise ImportError(f"Cannot detect format for {filename}. Use .csv or .json extension.")

    def parse_csv(self, file_content: bytes, import_type: str = "members") -> list[dict]:
        """Parse CSV file and return records."""
        try:
            text = file_content.decode("utf-8")
            reader = csv.DictReader(io.StringIO(text))
            records = list(reader)

            if not records:
                raise ImportError("CSV file is empty or has no data rows")

            logger.info(f"Parsed {len(records)} records from CSV")
            return records

        except UnicodeDecodeError as e:
            raise ImportError(f"CSV encoding error: {str(e)}")
        except Exception as e:
            raise ImportError(f"CSV parsing error: {str(e)}")

    def parse_json(self, file_content: bytes, import_type: str = "members") -> list[dict]:
        """Parse JSON file and return records."""
        try:
            text = file_content.decode("utf-8")
            data = json.loads(text)

            # Support both array and object with 'data' or 'records' key
            if isinstance(data, list):
                records = data
            elif isinstance(data, dict):
                records = data.get("data") or data.get("records") or [data]
            else:
                raise ImportError("JSON must be an array or object with 'data' or 'records' key")

            if not records:
                raise ImportError("JSON file has no records")

            if len(records) > self.max_records:
                raise ImportError(f"Too many records ({len(records)}). Maximum is {self.max_records}")

            logger.info(f"Parsed {len(records)} records from JSON")
            return records

        except json.JSONDecodeError as e:
            raise ImportError(f"JSON parsing error: {str(e)}")
        except Exception as e:
            raise ImportError(f"JSON error: {str(e)}")

    def validate_member_records(self, records: list[dict]) -> tuple[list[MemberImportRecord], list[str]]:
        """Validate member import records."""
        validated = []
        errors = []

        for idx, record in enumerate(records, 1):
            try:
                # Clean whitespace
                cleaned = {k: (v.strip() if isinstance(v, str) else v) for k, v in record.items()}

                # Validate required fields
                if not cleaned.get("name"):
                    raise ValueError("name is required")
                if not cleaned.get("phone"):
                    raise ValueError("phone is required")

                # Validate phone format (basic check)
                phone = str(cleaned.get("phone", "")).replace("+", "").replace("-", "").replace(" ", "")
                if not phone.isdigit() or len(phone) < 10:
                    raise ValueError(f"Invalid phone: {phone}")

                # Validate email if present
                email = cleaned.get("email", "").strip()
                if email and "@" not in email:
                    raise ValueError(f"Invalid email: {email}")

                member = MemberImportRecord(**cleaned)
                validated.append(member)

            except Exception as e:
                errors.append(f"Row {idx}: {str(e)}")

        return validated, errors

    def validate_payment_records(self, records: list[dict]) -> tuple[list[PaymentImportRecord], list[str]]:
        """Validate payment import records."""
        validated = []
        errors = []

        for idx, record in enumerate(records, 1):
            try:
                cleaned = {k: (v.strip() if isinstance(v, str) else v) for k, v in record.items()}

                if not cleaned.get("member_phone"):
                    raise ValueError("member_phone is required")
                if not cleaned.get("amount"):
                    raise ValueError("amount is required")
                if not cleaned.get("payment_method"):
                    raise ValueError("payment_method is required")
                if not cleaned.get("payment_date"):
                    raise ValueError("payment_date is required")

                # Validate amount
                try:
                    amount = float(cleaned.get("amount", 0))
                    if amount <= 0:
                        raise ValueError("amount must be positive")
                except ValueError:
                    raise ValueError(f"Invalid amount: {cleaned.get('amount')}")

                # Validate payment method
                method = cleaned.get("payment_method", "").lower()
                if method not in ["cash", "upi", "card"]:
                    raise ValueError(f"Invalid payment_method: {method}")

                payment = PaymentImportRecord(**cleaned)
                validated.append(payment)

            except Exception as e:
                errors.append(f"Row {idx}: {str(e)}")

        return validated, errors

    def validate_attendance_records(self, records: list[dict]) -> tuple[list[AttendanceImportRecord], list[str]]:
        """Validate attendance import records."""
        validated = []
        errors = []

        for idx, record in enumerate(records, 1):
            try:
                cleaned = {k: (v.strip() if isinstance(v, str) else v) for k, v in record.items()}

                if not cleaned.get("member_phone"):
                    raise ValueError("member_phone is required")
                if not cleaned.get("check_in_time"):
                    raise ValueError("check_in_time is required")

                attendance = AttendanceImportRecord(**cleaned)
                validated.append(attendance)

            except Exception as e:
                errors.append(f"Row {idx}: {str(e)}")

        return validated, errors

    async def import_file(
        self,
        file_content: bytes,
        filename: str,
        import_type: str = "members",
    ) -> ImportResult:
        """
        Import data from file (CSV or JSON).

        Args:
            file_content: Raw file bytes
            filename: Original filename
            import_type: "members", "payments", or "attendance"

        Returns:
            ImportResult with summary and errors
        """
        try:
            # Check file size
            if len(file_content) > self.max_file_size_mb * 1024 * 1024:
                raise ImportError(f"File too large (max {self.max_file_size_mb}MB)")

            # Detect and parse format
            file_format = self.detect_format(file_content, filename)
            logger.info(f"Importing {import_type} from {file_format.value} file")

            if file_format == ImportFormat.CSV:
                records = self.parse_csv(file_content, import_type)
            else:
                records = self.parse_json(file_content, import_type)

            # Validate based on type
            if import_type == "members":
                validated, errors = self.validate_member_records(records)
            elif import_type == "payments":
                validated, errors = self.validate_payment_records(records)
            elif import_type == "attendance":
                validated, errors = self.validate_attendance_records(records)
            else:
                raise ImportError(f"Unknown import type: {import_type}")

            result = ImportResult(
                total_records=len(records),
                successful=len(validated),
                failed=len(errors),
                errors=errors[:100],  # Limit to 100 errors
            )

            logger.info(f"Import complete: {result.total_records} total, {result.successful} valid, {result.failed} errors")
            return result

        except ImportError as e:
            logger.error(f"Import error: {str(e)}")
            return ImportResult(
                total_records=0,
                successful=0,
                failed=1,
                errors=[str(e)],
            )
        except Exception as e:
            logger.error(f"Unexpected import error: {str(e)}")
            return ImportResult(
                total_records=0,
                successful=0,
                failed=1,
                errors=[f"Unexpected error: {str(e)}"],
            )


# Singleton instance
_import_service: Optional[DataImportService] = None


def get_import_service() -> DataImportService:
    """Get or create import service instance."""
    global _import_service
    if _import_service is None:
        _import_service = DataImportService()
    return _import_service
