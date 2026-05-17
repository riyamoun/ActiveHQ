import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Home, CalendarCheck2, Wallet, User, LogOut } from 'lucide-react'
import { useMemberAuthStore } from '@/store/memberAuthStore'
import { AmbientBackground } from '@/components/brand/AmbientBackground'
import { Logo } from '@/components/brand/Logo'

const tabs = [
  { to: '/m', label: 'Home', Icon: Home, end: true },
  { to: '/m/attendance', label: 'Attend', Icon: CalendarCheck2, end: false },
  { to: '/m/payments', label: 'Pay', Icon: Wallet, end: false },
  { to: '/m/profile', label: 'Me', Icon: User, end: false },
]

export function MemberLayout() {
  const isAuthenticated = useMemberAuthStore((s) => s.isAuthenticated)
  const member = useMemberAuthStore((s) => s.member)
  const logout = useMemberAuthStore((s) => s.logout)
  const location = useLocation()

  if (!isAuthenticated || !member) {
    const redirectTo = location.pathname.startsWith('/m')
      ? `/m/login?next=${encodeURIComponent(location.pathname + location.search)}`
      : '/m/login'
    return <Navigate to={redirectTo} replace />
  }

  return (
    <div className="min-h-screen bg-black text-white antialiased relative isolate">
      <AmbientBackground variant="member" showLogoWatermark={false} />
      {/* ════════════════════════════════════════════════════════════════
          Top bar — minimal, surfaces gym + member identity
      ════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-30 bg-black/85 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-md mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Logo size="xs" to={null} animated={false} imgClassName="!h-7" />
            <div className="min-w-0">
              <div className="text-[10px] tracking-[0.25em] uppercase text-white/40 leading-none">
                {member.gym_name || 'Your gym'}
              </div>
              <div className="text-sm font-semibold leading-tight">
                Hey, {member.name.split(' ')[0]}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              logout()
            }}
            aria-label="Sign out"
            className="p-2 rounded-full hover:bg-white/5 text-white/60 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Body */}
      <main className="relative z-[1] max-w-md mx-auto px-5 pb-28 pt-5">
        <Outlet />
      </main>

      {/* ════════════════════════════════════════════════════════════════
          Bottom tab bar — single-thumb mobile nav
      ════════════════════════════════════════════════════════════════ */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 bg-black/95 backdrop-blur-xl border-t border-white/10"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="max-w-md mx-auto grid grid-cols-4">
          {tabs.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium tracking-wide transition-colors ${
                  isActive ? 'text-lime-400' : 'text-white/50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 ${isActive ? 'drop-shadow-[0_0_8px_rgba(163,230,53,0.5)]' : ''}`} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
