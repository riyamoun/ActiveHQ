import { api } from '@/lib/api'

// ── Request types ──────────────────────────────────────────────────

export interface MemberImportRow {
  name: string
  phone: string
  email?: string
  gender?: 'male' | 'female' | 'other'
  date_of_birth?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  joined_date?: string
  member_code?: string
  external_id?: string
  alternate_phone?: string
  alternative_phone?: string
  source_system?: string
  enrollment_status?: string
  remarks?: string
  notes?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  photo_url?: string
  import_metadata?: Record<string, unknown>
  plan_name?: string
  membership_start_date?: string
  membership_end_date?: string
  membership_amount?: number
  membership_status?: 'active' | 'expired' | 'paused' | 'cancelled'
}

export interface MemberImportRequest {
  members: MemberImportRow[]
  skip_duplicates?: boolean
  update_existing?: boolean
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
  import_ref?: string
  source_system?: string
  member_external_id?: string
  renewal_date?: string
  freeze_start_date?: string
  freeze_end_date?: string
  discount_amount?: number
  payment_method?: string
  auto_renewal?: boolean
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
  memberships_created?: number
  photos_imported?: number
  skipped_duplicates?: number
  skipped_unknown_member?: number
  skipped_duplicate?: number
  skipped?: number
  updated?: number
  errors: string[]
}

export type ImportPreviewAction = 'create' | 'update' | 'skip' | 'error'

export interface ImportPreviewRow {
  row_number: number
  action: ImportPreviewAction
  summary: string
  identifier?: string | null
}

export interface ImportPreviewResult {
  total_rows: number
  will_create: number
  will_update: number
  will_skip: number
  error_count: number
  rows: ImportPreviewRow[]
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
  async previewMembers(data: MemberImportRequest): Promise<ImportPreviewResult> {
    const res = await api.post<ImportPreviewResult>('/migration/members/preview', data)
    return res.data
  },

  async previewPlans(data: { plans: PlanImportRow[] }): Promise<ImportPreviewResult> {
    const res = await api.post<ImportPreviewResult>('/migration/plans/preview', data)
    return res.data
  },

  async previewMemberships(data: { memberships: MembershipImportRow[] }): Promise<ImportPreviewResult> {
    const res = await api.post<ImportPreviewResult>('/migration/memberships/preview', data)
    return res.data
  },

  async previewPayments(data: { payments: PaymentImportRow[] }): Promise<ImportPreviewResult> {
    const res = await api.post<ImportPreviewResult>('/migration/payments/preview', data)
    return res.data
  },

  async previewAttendance(data: { records: AttendanceImportRow[]; source_label?: string }): Promise<ImportPreviewResult> {
    const res = await api.post<ImportPreviewResult>('/migration/attendance/preview', data)
    return res.data
  },

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
