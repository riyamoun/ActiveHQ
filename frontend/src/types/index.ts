// Enums
export type UserRole = 'owner' | 'manager' | 'staff'
export type Gender = 'male' | 'female' | 'other'
export type MembershipStatus = 'active' | 'expired' | 'paused' | 'cancelled'
export type PaymentMode = 'cash' | 'upi' | 'card' | 'bank_transfer' | 'other'
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'suspended'

// Auth
export interface User {
  id: string
  gym_id: string
  email: string
  name: string
  phone: string | null
  role: UserRole
  is_active: boolean
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  gym_name: string
  gym_email: string
  gym_phone: string
  city?: string
  state?: string
  owner_name: string
  owner_email: string
  owner_password: string
}

// Gym
export interface Gym {
  id: string
  name: string
  slug: string
  owner_name: string
  email: string
  phone: string
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  gst_number: string | null
  subscription_status: SubscriptionStatus
  subscription_start: string | null
  subscription_end: string | null
  setup_fee_paid: boolean
  billing_cycle: 'monthly' | 'yearly' | null
  settings: Record<string, unknown>
  is_active: boolean
}

// Member
export interface Member {
  id: string
  gym_id: string
  member_code: string | null
  name: string
  email: string | null
  phone: string
  alternate_phone: string | null
  gender: Gender | null
  date_of_birth: string | null
  address: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  photo_url: string | null
  joined_date: string
  notes: string | null
  is_active: boolean
}

export interface MemberWithMembership extends Member {
  current_membership_status: MembershipStatus | null
  current_membership_end: string | null
  current_plan_name: string | null
  amount_due: number | null
}

export interface MemberSummary {
  id: string
  name: string
  phone: string
  member_code: string | null
  joined_date: string
  is_active: boolean
}

export interface MemberListResponse {
  items: MemberSummary[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface MemberCreate {
  name: string
  email?: string
  phone: string
  alternate_phone?: string
  gender?: Gender
  date_of_birth?: string
  address?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  joined_date?: string
  notes?: string
  member_code?: string
}

// Plan
export interface Plan {
  id: string
  gym_id: string
  name: string
  description: string | null
  duration_days: number
  price: number
  is_active: boolean
}

export interface PlanCreate {
  name: string
  description?: string
  duration_days: number
  price: number
}

// Membership
export interface Membership {
  id: string
  gym_id: string
  member_id: string
  plan_id: string
  start_date: string
  end_date: string
  amount_total: number
  amount_paid: number
  amount_due: number
  status: MembershipStatus
  notes: string | null
  created_by: string | null
  member_name: string | null
  member_phone: string | null
  plan_name: string | null
}

export interface MembershipCreate {
  member_id: string
  plan_id: string
  start_date?: string
  amount_total?: number
  amount_paid?: number
  notes?: string
}

export interface MembershipSummary {
  id: string
  member_id: string
  member_name: string
  plan_name: string
  start_date: string
  end_date: string
  status: MembershipStatus
  amount_due: number
}

// Payment
export interface Payment {
  id: string
  gym_id: string
  member_id: string
  membership_id: string | null
  amount: number
  tax_amount: number
  total_amount: number
  payment_mode: PaymentMode
  payment_date: string
  reference_number: string | null
  notes: string | null
  received_by: string | null
  member_name: string | null
  member_phone: string | null
  received_by_name: string | null
}

export interface PaymentCreate {
  member_id: string
  membership_id?: string
  amount: number
  tax_amount?: number
  payment_mode: PaymentMode
  payment_date?: string
  reference_number?: string
  notes?: string
}

export interface PaymentSummary {
  id: string
  member_name: string
  amount: number
  payment_mode: PaymentMode
  payment_date: string
}

export interface DailyCollectionSummary {
  date: string
  total_amount: number
  payment_count: number
  by_mode: Record<string, number>
}

// Attendance
export interface Attendance {
  id: string
  gym_id: string
  member_id: string
  check_in_time: string
  check_out_time: string | null
  marked_by: string | null
  member_name: string | null
  member_phone: string | null
  marked_by_name: string | null
}

export interface AttendanceSummary {
  id: string
  member_name: string
  check_in_time: string
  check_out_time: string | null
}

export interface DailyAttendanceSummary {
  date: string
  total_check_ins: number
  unique_members: number
}

// Reports
export interface DashboardStats {
  total_members: number
  active_members: number
  expiring_soon: number
  expired_members: number
  today_check_ins: number
  today_collection: number
  members_with_dues: number
  total_dues: number
}

export interface MembershipStats {
  total_active: number
  total_paused: number
  total_expired: number
  expiring_this_week: number
  expiring_this_month: number
}

export interface ExpiringMemberInfo {
  member_id: string
  member_name: string
  member_phone: string
  plan_name: string
  end_date: string
  days_until_expiry: number
  amount_due: number
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}
