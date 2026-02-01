import { api } from '@/lib/api'
import type { DashboardStats, MembershipStats, ExpiringMemberInfo } from '@/types'

interface CollectionReport {
  from_date: string
  to_date: string
  total_amount: number
  total_transactions: number
  by_mode: Record<string, number>
  daily_breakdown: { date: string; amount: number; count: number }[]
}

interface DuesMemberInfo {
  member_id: string
  member_name: string
  member_phone: string
  total_due: number
  membership_end: string | null
}

export const reportService = {
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get<DashboardStats>('/reports/dashboard')
    return response.data
  },

  async getMembershipStats(): Promise<MembershipStats> {
    const response = await api.get<MembershipStats>('/reports/memberships')
    return response.data
  },

  async getCollectionReport(fromDate: string, toDate: string): Promise<CollectionReport> {
    const response = await api.get<CollectionReport>('/reports/collection', {
      params: { from_date: fromDate, to_date: toDate },
    })
    return response.data
  },

  async getTodayCollection(): Promise<CollectionReport> {
    const response = await api.get<CollectionReport>('/reports/collection/today')
    return response.data
  },

  async getThisWeekCollection(): Promise<CollectionReport> {
    const response = await api.get<CollectionReport>('/reports/collection/this-week')
    return response.data
  },

  async getThisMonthCollection(): Promise<CollectionReport> {
    const response = await api.get<CollectionReport>('/reports/collection/this-month')
    return response.data
  },

  async getExpiringMembers(days: number = 7): Promise<ExpiringMemberInfo[]> {
    const response = await api.get<ExpiringMemberInfo[]>('/reports/expiring-members', {
      params: { days },
    })
    return response.data
  },

  async getMembersWithDues(): Promise<DuesMemberInfo[]> {
    const response = await api.get<DuesMemberInfo[]>('/reports/members-with-dues')
    return response.data
  },
}
