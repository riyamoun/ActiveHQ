import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Calendar,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Package,
} from 'lucide-react'
import { AmbientBackground } from '@/components/brand/AmbientBackground'
import { Logo } from '@/components/brand/Logo'
import { format } from 'date-fns'
import clsx from 'clsx'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'Plans', href: '/plans', icon: Package },
  { name: 'Memberships', href: '/memberships', icon: ClipboardList },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Attendance', href: '/attendance', icon: Calendar },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, gym, refreshToken, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await authService.logout(refreshToken)
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-950 relative">
      <AmbientBackground variant="dashboard" showLogoWatermark={false} className="fixed" />
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 z-50 h-full w-72 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/50 transform transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-20 flex items-center px-6 border-b border-slate-800/50">
          <Logo size="sm" to="/dashboard" />
        </div>

        {/* Gym info */}
        <div className="px-8 py-5 border-b border-slate-800/50">
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mb-1">Workspace</p>
          <p className="text-white font-medium truncate text-sm">{gym?.name || 'Your Gym'}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="status-dot status-dot-live" />
            <span className="text-[11px] text-emerald-400">Active</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-5 space-y-1 flex-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200',
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/5'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                )
              }
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Bottom user section */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-800/50">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-800/30">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-sky-500/20 border border-slate-700/50 flex items-center justify-center">
                <span className="text-xs font-semibold text-white">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-500 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-8 py-3.5 text-sm text-slate-500 hover:bg-slate-800/40 hover:text-red-400 w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-72 relative z-[1]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/40 flex items-center justify-between px-6 lg:px-8">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Left: Breadcrumb / date */}
          <div className="hidden lg:flex items-center gap-3">
            <p className="text-sm text-slate-400">{format(new Date(), 'EEEE, d MMM yyyy')}</p>
          </div>

          {/* Spacer */}
          <div className="flex-1 lg:hidden" />

          {/* Right section */}
          <div className="flex items-center gap-3">
            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-800/60 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-slate-700/50 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-slate-200">{user?.name}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900 rounded-xl shadow-2xl shadow-black/40 border border-slate-800 py-1 z-50">
                    <div className="px-4 py-3 border-b border-slate-800">
                      <p className="text-sm font-medium text-white">{user?.name}</p>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => { setUserMenuOpen(false); navigate('/settings') }}
                      className="w-full px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-slate-800 flex items-center gap-3 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-500" />
                      Settings
                    </button>
                    <button
                      onClick={() => { setUserMenuOpen(false); handleLogout() }}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-slate-800 flex items-center gap-3 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
