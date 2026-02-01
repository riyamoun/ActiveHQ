import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Gym } from '@/types'

interface AuthState {
  user: User | null
  gym: Gym | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setUser: (user: User) => void
  setGym: (gym: Gym) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  login: (user: User, gym: Gym, accessToken: string, refreshToken: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      gym: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setUser: (user) => set({ user }),
      
      setGym: (gym) => set({ gym }),
      
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      login: (user, gym, accessToken, refreshToken) =>
        set({
          user,
          gym,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: null,
          gym: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'activehq-auth',
      partialize: (state) => ({
        user: state.user,
        gym: state.gym,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
