"""
Pydantic schemas for attendance management.
"""

import uuid
from datetime import datetime, date
from pydantic import BaseModel


class CheckInRequest(BaseModel):
    """Schema for checking in a member."""
    member_id: uuid.UUID


class CheckOutRequest(BaseModel):
    """Schema for checking out a member."""
    pass  # Just needs authentication, member_id comes from path


class AttendanceResponse(BaseModel):
    """Attendance record response."""
    id: uuid.UUID
    gym_id: uuid.UUID
    member_id: uuid.UUID
    check_in_time: datetime
    check_out_time: datetime | None
    marked_by: uuid.UUID | None
    
    # Related info
    member_name: str | None = None
    member_phone: str | None = None
    marked_by_name: str | None = None
    
    model_config = {"from_attributes": True}


class AttendanceSummary(BaseModel):
    """Minimal attendance info for lists."""
    id: uuid.UUID
    member_name: str
    check_in_time: datetime
    check_out_time: datetime | None
    
    model_config = {"from_attributes": True}


class DailyAttendanceSummary(BaseModel):
    """Daily attendance summary."""
    date: date
    total_check_ins: int
    unique_members: int


class AttendanceListResponse(BaseModel):
    """Paginated attendance list."""
    items: list[AttendanceSummary]
    total: int
    page: int
    page_size: int
