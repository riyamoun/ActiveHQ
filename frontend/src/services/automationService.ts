import { api } from '@/lib/api'

export interface ReminderMessage {
  campaign_name: string
  message_text: string
}

export interface ReminderMemberRow {
  member_id: string
  member_name: string
  phone: string
  days_until_expiry?: number
  amount_due?: number
  end_date?: string
  messages: ReminderMessage[]
}

export interface ReminderListResponse {
  expiring: ReminderMemberRow[]
  dues: ReminderMemberRow[]
}

export const automationService = {
  async getReminderList(expiringDays: number = 7): Promise<ReminderListResponse> {
    const response = await api.get<ReminderListResponse>('/automation/reminder-list', {
      params: { expiring_days: expiringDays },
    })
    return response.data
  },
}

