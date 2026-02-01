# Attendance tracking module
from app.attendance.router import router
from app.attendance.service import AttendanceService

__all__ = ["router", "AttendanceService"]
