import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const theme = useThemeStore((state) => state.resolvedTheme)
  const setTheme = useThemeStore((state) => state.setTheme)
  const currentTheme = useThemeStore((state) => state.theme)

  useEffect(() => {
    setMounted(true)
    useThemeStore.getState().initializeTheme()
  }, [])

  if (!mounted) {
    return (
      <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
        <Sun className="w-5 h-5" />
      </button>
    )
  }

  return (
    <button
      onClick={() => {
        // Cycle through light -> dark -> system
        if (currentTheme === 'light') {
          setTheme('dark')
        } else if (currentTheme === 'dark') {
          setTheme('system')
        } else {
          setTheme('light')
        }
      }}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      title={`Theme: ${currentTheme}. Current: ${theme}`}
    >
      {theme === 'dark' ? (
        <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      ) : (
        <Sun className="w-5 h-5 text-yellow-600" />
      )}
    </button>
  )
}
