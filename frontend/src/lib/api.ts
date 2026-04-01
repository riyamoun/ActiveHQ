import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/authStore'
import { API_CONSTANTS } from '@/constants'

const API_BASE_URL = API_CONSTANTS.BASE_URL
const TIMEOUT_MS = API_CONSTANTS.TIMEOUT

function createBaseClient() {
  return axios.create({
    baseURL: API_BASE_URL,
    timeout: TIMEOUT_MS,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

/**
 * Unauthenticated API calls only: no Bearer header, no 401 refresh.
 * Use for /public/*, /auth/login, /auth/register so stale tokens cannot break these flows.
 */
export const publicApi = createBaseClient()

/**
 * Authenticated app API: attaches Bearer token and refreshes on 401 when appropriate.
 */
export const api = createBaseClient()

function shouldSkipTokenRefresh(config: InternalAxiosRequestConfig | undefined): boolean {
  if (!config?.url) return false
  const u = config.url
  if (u.includes('/public/')) return true
  if (u.includes('/auth/login') || u.includes('/auth/register') || u.includes('/auth/refresh')) return true
  return false
}

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status !== 401 || originalRequest._retry || shouldSkipTokenRefresh(originalRequest)) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    const refreshToken = useAuthStore.getState().refreshToken
    if (!refreshToken) {
      return Promise.reject(error)
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refresh_token: refreshToken,
      })

      const { access_token, refresh_token } = response.data
      useAuthStore.getState().setTokens(access_token, refresh_token)

      originalRequest.headers.Authorization = `Bearer ${access_token}`
      return api(originalRequest)
    } catch {
      useAuthStore.getState().logout()
      return Promise.reject(error)
    }
  }
)

const SERVER_UNAVAILABLE =
  'We could not reach the server. Check your connection. If you use a custom domain, set VITE_API_URL to your API base URL and add your site to CORS_ORIGINS_STR on the backend.'

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return SERVER_UNAVAILABLE
    }
    const data = error.response.data as { detail?: unknown } | undefined
    if (data?.detail) {
      if (typeof data.detail === 'string') {
        return data.detail
      }
      if (Array.isArray(data.detail)) {
        return data.detail.map((d: { msg: string }) => d.msg).join(', ')
      }
    }
    if (error.response.status >= 500) {
      return 'Something went wrong on the server. Please try again in a moment.'
    }
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unexpected error occurred'
}
