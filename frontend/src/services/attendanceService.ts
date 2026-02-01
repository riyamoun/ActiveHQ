import { api } from '@/lib/api'
import type { Attendance, AttendanceSummary, DailyAttendanceSummary } from '@/types'

interface AttendanceListResponse {
  items: AttendanceSummary[]
  total: number
  page: number
  page_size: number
}

export const attendanceService = {
  async checkIn(memberId: string): Promise<Attendance> {
    const response = await api.post<Attendance>('/attendance/check-in', {
      member_id: memberId,
    })
    return response.data
  },

  async checkOut(memberId: string): Promise<Attendance> {
    const response = await api.post<Attendance>(`/attendance/check-out/${memberId}`)
    return response.data
  },

  async getAttendance(params: {
    target_date?: string
    member_id?: string
    page?: number
    page_size?: number
  }): Promise<AttendanceListResponse> {
    const response = await api.get<AttendanceListResponse>('/attendance', { params })
    return response.data
  },

  async getTodaySummary(): Promise<DailyAttendanceSummary> {
    const response = await api.get<DailyAttendanceSummary>('/attendance/today')
    return response.data
  },

  async getDailySummary(date: string): Promise<DailyAttendanceSummary> {
    const response = await api.get<DailyAttendanceSummary>('/attendance/daily-summary', {
      params: { target_date: date },
    })
    return response.data
  },

  async getCurrentlyCheckedIn(): Promise<Attendance[]> {
    const response = await api.get<Attendance[]>('/attendance/currently-in')
    return response.data
  },

  async getMemberAttendance(
    memberId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<Attendance[]> {
    const response = await api.get<Attendance[]>(`/attendance/member/${memberId}`, {
      params: { from_date: fromDate, to_date: toDate },
    })
    return response.data
  },
}
