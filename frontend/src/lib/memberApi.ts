/**
 * API client + types for the Member Portal (`/m/*` routes).
 *
 * Uses a separate axios instance from the staff `api` so that the two auth
 * worlds never bleed into each other (different token, different storage).
 */

import axios from 'axios'
import { useMemberAuthStore } from '@/store/memberAuthStore'
import { getErrorMessage } from '@/lib/api'

// ─────────────────────────────────────────────────────────────────────
// Resolve the base URL for /api/m/*. We reuse VITE_API_URL when set,
// otherwise fall back to the same host the staff API points at.
// ─────────────────────────────────────────────────────────────────────
function resolveMemberBase(): string {
  const env = (import.meta as any).env?.VITE_API_URL?.trim()
  if (env) return `${env.replace(/\/+$/, '')}/api/m`
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    const isVercel = host.endsWith('.vercel.app')
    const isProd = host === 'activehq.fit' || host === 'www.activehq.fit'
    if (isVercel || isProd) return 'https://activehq-api.onrender.com/api/m'
  }
  return '/api/m'
}

export const memberApi = axios.create({
  baseURL: resolveMemberBase(),
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

memberApi.interceptors.request.use((config) => {
  const token = useMemberAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

memberApi.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error?.response?.status === 401) {
      useMemberAuthStore.getState().logout()
    }
    return Promise.reject(error)
  }
)

export { getErrorMessage }

// ─────────────────────────────────────────────────────────────────────
// Types — mirror the backend Pydantic schemas
// ─────────────────────────────────────────────────────────────────────

export type MembershipStatus = 'active' | 'expired' | 'paused' | 'cancelled'
export type PaymentMode = 'cash' | 'upi' | 'card' | 'bank_transfer' | 'other'

export interface MemberMe {
  id: string
  gym_id: string
  gym_name: string
  name: string
  email: string | null
  phone: string
  photo_url: string | null
  joined_date: string | null
}

export interface ActivePlan {
  membership_id: string | null
  plan_name: string | null
  status: MembershipStatus | null
  start_date: string | null
  end_date: string | null
  days_remaining: number | null
  price: number | null
  amount_paid: number | null
  amount_due: number | null
}

export interface AttendanceEntry {
  id: string
  check_in_time: string
  check_out_time: string | null
  duration_minutes: number | null
}

export interface PaymentEntry {
  id: string
  amount: number
  payment_mode: PaymentMode
  payment_date: string
  notes: string | null
  reference_number: string | null
}

export interface MemberTokenResponse {
  access_token: string
  token_type: 'bearer'
  expires_in: number
  member: MemberMe
}

export interface MemberGymChoice {
  selection_token: string
  member_id: string
  gym_id: string
  gym_name: string
  gym_city: string | null
}

export interface AuthChallengeResponse {
  token: MemberTokenResponse | null
  choices: MemberGymChoice[] | null
}

// ─────────────────────────────────────────────────────────────────────
// Auth API
// ─────────────────────────────────────────────────────────────────────

export async function requestOtp(phone: string): Promise<{ sent: boolean; delivered?: boolean; debug_code?: string }> {
  const { data } = await memberApi.post('/auth/otp/request', { phone })
  return data
}

export async function verifyOtp(phone: string, code: string): Promise<AuthChallengeResponse> {
  const { data } = await memberApi.post('/auth/otp/verify', { phone, code })
  return data
}

export async function requestMagicLink(email: string): Promise<{ sent: boolean; delivered?: boolean; debug_link?: string }> {
  const { data } = await memberApi.post('/auth/magic-link/request', { email })
  return data
}

export async function verifyMagicLink(token: string): Promise<AuthChallengeResponse> {
  const { data } = await memberApi.post('/auth/magic-link/verify', { token })
  return data
}

export async function googleSignIn(idToken: string): Promise<AuthChallengeResponse> {
  const { data } = await memberApi.post('/auth/google', { id_token: idToken })
  return data
}

export async function selectMember(selectionToken: string, memberId: string): Promise<MemberTokenResponse> {
  const { data } = await memberApi.post('/auth/select-member', {
    selection_token: selectionToken,
    member_id: memberId,
  })
  return data
}

// ─────────────────────────────────────────────────────────────────────
// Data API
// ─────────────────────────────────────────────────────────────────────

export async function fetchMe(): Promise<MemberMe> {
  const { data } = await memberApi.get('/me')
  return data
}

export async function fetchMyPlan(): Promise<ActivePlan> {
  const { data } = await memberApi.get('/me/plan')
  return data
}

export async function fetchMyAttendance(days = 90, limit = 60): Promise<AttendanceEntry[]> {
  const { data } = await memberApi.get('/me/attendance', { params: { days, limit } })
  return data
}

export async function fetchMyPayments(limit = 20): Promise<PaymentEntry[]> {
  const { data } = await memberApi.get('/me/payments', { params: { limit } })
  return data
}
