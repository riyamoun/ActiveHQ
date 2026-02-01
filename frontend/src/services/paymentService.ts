import { api } from '@/lib/api'
import type { Payment, PaymentCreate, PaymentSummary, DailyCollectionSummary } from '@/types'

interface PaymentListResponse {
  items: PaymentSummary[]
  total: number
  total_amount: number
  page: number
  page_size: number
}

export const paymentService = {
  async getPayments(params: {
    member_id?: string
    from_date?: string
    to_date?: string
    payment_mode?: string
    page?: number
    page_size?: number
  }): Promise<PaymentListResponse> {
    const response = await api.get<PaymentListResponse>('/payments', { params })
    return response.data
  },

  async getPayment(id: string): Promise<Payment> {
    const response = await api.get<Payment>(`/payments/${id}`)
    return response.data
  },

  async getMemberPayments(memberId: string): Promise<Payment[]> {
    const response = await api.get<Payment[]>(`/payments/member/${memberId}`)
    return response.data
  },

  async createPayment(data: PaymentCreate): Promise<Payment> {
    const response = await api.post<Payment>('/payments', data)
    return response.data
  },

  async getDailyCollection(date?: string): Promise<DailyCollectionSummary> {
    const response = await api.get<DailyCollectionSummary>('/payments/daily', {
      params: { target_date: date },
    })
    return response.data
  },

  async getCollectionRange(
    fromDate: string,
    toDate: string
  ): Promise<DailyCollectionSummary[]> {
    const response = await api.get<DailyCollectionSummary[]>('/payments/collection-range', {
      params: { from_date: fromDate, to_date: toDate },
    })
    return response.data
  },
}
