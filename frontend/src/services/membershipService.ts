import { api } from '@/lib/api'
import type { Membership, MembershipCreate, MembershipSummary } from '@/types'

interface MembershipListResponse {
  items: MembershipSummary[]
  total: number
  page: number
  page_size: number
}

export const membershipService = {
  async getMemberships(params: {
    status?: string
    page?: number
    page_size?: number
  }): Promise<MembershipListResponse> {
    const response = await api.get<MembershipListResponse>('/memberships', { params })
    return response.data
  },

  async getMembership(id: string): Promise<Membership> {
    const response = await api.get<Membership>(`/memberships/${id}`)
    return response.data
  },

  async getMemberMemberships(memberId: string): Promise<Membership[]> {
    const response = await api.get<Membership[]>(`/memberships/member/${memberId}`)
    return response.data
  },

  async createMembership(data: MembershipCreate): Promise<Membership> {
    const response = await api.post<Membership>('/memberships', data)
    return response.data
  },

  async renewMembership(
    memberId: string,
    data: {
      plan_id?: string
      start_date?: string
      amount_total?: number
      amount_paid?: number
      notes?: string
    }
  ): Promise<Membership> {
    const response = await api.post<Membership>(`/memberships/member/${memberId}/renew`, data)
    return response.data
  },

  async pauseMembership(id: string): Promise<Membership> {
    const response = await api.post<Membership>(`/memberships/${id}/pause`)
    return response.data
  },

  async resumeMembership(id: string): Promise<Membership> {
    const response = await api.post<Membership>(`/memberships/${id}/resume`)
    return response.data
  },

  async cancelMembership(id: string): Promise<Membership> {
    const response = await api.post<Membership>(`/memberships/${id}/cancel`)
    return response.data
  },
}
