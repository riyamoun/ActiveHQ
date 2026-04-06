import { api } from '@/lib/api'

// ── Request types ──────────────────────────────────────────────────

export interface MemberImportRow {
  name: string
  phone: string
  email?: string
  gender?: 'male' | 'female' | 'other'
  date_of_birth?: string
  address?: string
  joined_date?: string
  member_code?: string
  notes?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
}

export interface MemberImportRequest {
  members: MemberImportRow[]
  skip_duplicates?: boolean
}

export interface PlanImportRow {
  name: string
  duration_days: number
  price: number
  description?: string
}

export interface MembershipImportRow {
  member_phone: string
  plan_name: string
  start_date: string
  end_date: string
  amount_total: number
  amount_paid?: number
  status?: 'active' | 'expired' | 'paused' | 'cancelled'
}

export interface PaymentImportRow {
  member_phone: string
  amount: number
  payment_date: string
  payment_mode?: 'cash' | 'upi' | 'card' | 'bank_transfer' | 'other'
  reference_number?: string
  notes?: string
}

export interface AttendanceImportRow {
  person_identifier: string
  timestamp: string
  punch_type?: 'check_in' | 'check_out' | 'unknown'
}

export interface DeviceUserMappingRow {
  device_external_id: string
  device_user_id: string
  member_phone?: string
  member_code?: string
}

// ── Response types ─────────────────────────────────────────────────

export interface ImportResult {
  total_received: number
  created: number
  skipped_duplicates?: number
  skipped_unknown_member?: number
  skipped_duplicate?: number
  skipped?: number
  updated?: number
  errors: string[]
}

export interface ReconciliationReport {
  period_days: number
  total_members: number
  active_members: number
  total_memberships: number
  active_memberships: number
  total_attendance_punches: number
  total_payments: number
  total_revenue: number
  unmapped_device_users: number
  biometric_conflicts: number
}

export interface DeviceSyncStatus {
  device_id: string
  device_name: string
  vendor: string
  is_active: boolean
  last_seen_at: string | null
  mapped_members: number
  total_events: number
  events_last_24h: number
  conflict_events: number
}

export interface BiometricSyncOverview {
  total_devices: number
  active_devices: number
  total_mapped_members: number
  last_event_at: string | null
  devices: DeviceSyncStatus[]
}

// ── API calls ──────────────────────────────────────────────────────

export const migrationService = {
  async importMembers(data: MemberImportRequest): Promise<ImportResult> {
    const res = await api.post<ImportResult>('/migration/members', data)
    return res.data
  },

  async importPlans(data: { plans: PlanImportRow[] }): Promise<ImportResult> {
    const res = await api.post<ImportResult>('/migration/plans', data)
    return res.data
  },

  async importMemberships(data: { memberships: MembershipImportRow[] }): Promise<ImportResult> {
    const res = await api.post<ImportResult>('/migration/memberships', data)
    return res.data
  },

  async importPayments(data: { payments: PaymentImportRow[] }): Promise<ImportResult> {
    const res = await api.post<ImportResult>('/migration/payments', data)
    return res.data
  },

  async importAttendance(data: { records: AttendanceImportRow[]; source_label?: string }): Promise<ImportResult> {
    const res = await api.post<ImportResult>('/migration/attendance', data)
    return res.data
  },

  async importDeviceUserMappings(data: { mappings: DeviceUserMappingRow[] }): Promise<ImportResult> {
    const res = await api.post<ImportResult>('/migration/device-mappings', data)
    return res.data
  },

  async getReconciliation(days: number = 30): Promise<ReconciliationReport> {
    const res = await api.post<ReconciliationReport>('/migration/reconciliation', { days })
    return res.data
  },

  async getBiometricSync(): Promise<BiometricSyncOverview> {
    const res = await api.get<BiometricSyncOverview>('/migration/biometric-sync')
    return res.data
  },
}
