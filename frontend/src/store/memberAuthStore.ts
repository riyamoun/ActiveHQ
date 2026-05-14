import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MemberMe } from '@/lib/memberApi'

interface MemberAuthState {
  member: MemberMe | null
  accessToken: string | null
  isAuthenticated: boolean
  login: (member: MemberMe, accessToken: string) => void
  setMember: (member: MemberMe) => void
  logout: () => void
}

export const useMemberAuthStore = create<MemberAuthState>()(
  persist(
    (set) => ({
      member: null,
      accessToken: null,
      isAuthenticated: false,

      login: (member, accessToken) =>
        set({ member, accessToken, isAuthenticated: true }),

      setMember: (member) => set({ member }),

      logout: () =>
        set({ member: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: 'activehq-member-auth',
      partialize: (state) => ({
        member: state.member,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
