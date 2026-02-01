import { api } from '@/lib/api'
import type { Plan, PlanCreate } from '@/types'

export const planService = {
  async getPlans(includeInactive: boolean = false): Promise<Plan[]> {
    const response = await api.get<Plan[]>('/plans', {
      params: { include_inactive: includeInactive },
    })
    return response.data
  },

  async getActivePlans(): Promise<Plan[]> {
    const response = await api.get<Plan[]>('/plans/active')
    return response.data
  },

  async getPlan(id: string): Promise<Plan> {
    const response = await api.get<Plan>(`/plans/${id}`)
    return response.data
  },

  async createPlan(data: PlanCreate): Promise<Plan> {
    const response = await api.post<Plan>('/plans', data)
    return response.data
  },

  async updatePlan(id: string, data: Partial<PlanCreate & { is_active: boolean }>): Promise<Plan> {
    const response = await api.put<Plan>(`/plans/${id}`, data)
    return response.data
  },

  async deletePlan(id: string): Promise<void> {
    await api.delete(`/plans/${id}`)
  },
}
