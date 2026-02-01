import { api } from '@/lib/api'
import type { User, TokenResponse, LoginRequest, RegisterRequest, Gym } from '@/types'

interface RegisterResponse {
  gym_id: string
  gym_name: string
  user: User
  tokens: TokenResponse
}

export const authService = {
  async login(data: LoginRequest): Promise<TokenResponse> {
    const response = await api.post<TokenResponse>('/auth/login', data)
    return response.data
  },

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>('/auth/register', data)
    return response.data
  },

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const response = await api.post<TokenResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    })
    return response.data
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me')
    return response.data
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.put('/auth/me/password', {
      current_password: currentPassword,
      new_password: newPassword,
    })
  },

  async getUsers(): Promise<User[]> {
    const response = await api.get<User[]>('/auth/users')
    return response.data
  },

  async createUser(data: {
    email: string
    password: string
    name: string
    phone?: string
    role: string
  }): Promise<User> {
    const response = await api.post<User>('/auth/users', data)
    return response.data
  },
}

export const gymService = {
  async getCurrentGym(): Promise<Gym> {
    const response = await api.get<Gym>('/gym/current')
    return response.data
  },

  async updateGym(data: Partial<Gym>): Promise<Gym> {
    const response = await api.put<Gym>('/gym/current', data)
    return response.data
  },

  async updateSettings(settings: Record<string, unknown>): Promise<Gym> {
    const response = await api.put<Gym>('/gym/current/settings', { settings })
    return response.data
  },
}
