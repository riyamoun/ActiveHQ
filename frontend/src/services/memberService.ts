import { api } from '@/lib/api'
import type {
  Member,
  MemberWithMembership,
  MemberListResponse,
  MemberCreate,
} from '@/types'

export const memberService = {
  async getMembers(params: {
    query?: string
    status?: string
    page?: number
    page_size?: number
  }): Promise<MemberListResponse> {
    const response = await api.get<MemberListResponse>('/members', { params })
    return response.data
  },

  async getMember(id: string): Promise<MemberWithMembership> {
    const response = await api.get<MemberWithMembership>(`/members/${id}`)
    return response.data
  },

  async createMember(data: MemberCreate): Promise<Member> {
    const response = await api.post<Member>('/members', data)
    return response.data
  },

  async updateMember(id: string, data: Partial<MemberCreate>): Promise<Member> {
    const response = await api.put<Member>(`/members/${id}`, data)
    return response.data
  },

  async deleteMember(id: string): Promise<void> {
    await api.delete(`/members/${id}`)
  },

  async reactivateMember(id: string): Promise<Member> {
    const response = await api.post<Member>(`/members/${id}/reactivate`)
    return response.data
  },

  async getExpiringMembers(days: number = 7): Promise<MemberWithMembership[]> {
    const response = await api.get<MemberWithMembership[]>('/members/expiring', {
      params: { days },
    })
    return response.data
  },

  async getMembersWithDues(): Promise<MemberWithMembership[]> {
    const response = await api.get<MemberWithMembership[]>('/members/with-dues')
    return response.data
  },
}
