import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface ThemeStore {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  initializeTheme: () => void
}

// Detect system preference
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Get resolved theme (accounting for system preference)
const getResolvedTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'system') {
    return getSystemTheme()
  }
  return theme
}

// Apply theme to DOM
const applyTheme = (theme: 'light' | 'dark') => {
  const html = document.documentElement
  if (theme === 'dark') {
    html.classList.add('dark')
  } else {
    html.classList.remove('dark')
  }
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: getSystemTheme(),

      setTheme: (theme: Theme) => {
        const resolved = getResolvedTheme(theme)
        applyTheme(resolved)
        set({ theme, resolvedTheme: resolved })
      },

      toggleTheme: () => {
        const current = get().resolvedTheme
        const next = current === 'light' ? 'dark' : 'light'
        const resolved = getResolvedTheme(next)
        applyTheme(resolved)
        set({ theme: next, resolvedTheme: resolved })
      },

      initializeTheme: () => {
        const stored = localStorage.getItem('theme-store')
        if (stored) {
          const { state } = JSON.parse(stored)
          const resolved = getResolvedTheme(state.theme)
          applyTheme(resolved)
          set({ theme: state.theme, resolvedTheme: resolved })
        } else {
          const resolved = getSystemTheme()
          applyTheme(resolved)
          set({ theme: 'system', resolvedTheme: resolved })
        }

        // Listen for system preference changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const handleChange = (e: MediaQueryListEvent) => {
          if (get().theme === 'system') {
            const resolved = e.matches ? 'dark' : 'light'
            applyTheme(resolved)
            set({ resolvedTheme: resolved })
          }
        }

        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
      },
    }),
    {
      name: 'theme-store',
    }
  )
)
