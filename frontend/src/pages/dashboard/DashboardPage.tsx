import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { reportService } from '@/services/reportService'
import { automationService } from '@/services/automationService'
import { migrationService } from '@/services/migrationService'
import { useAuthStore } from '@/store/authStore'
import {
  Users,
  UserCheck,
  IndianRupee,
  Calendar,
  MessageCircle,
  ArrowRight,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  TrendingUp,
  Activity,
  UserPlus,
  Send,
  Wifi,
  WifiOff,
  Zap,
  Shield,
  Target,
  Eye,
  ChevronRight,
  Sparkles,
  BarChart3,
  CircleDot,
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import clsx from 'clsx'

function AnimatedCounter({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (value === 0) { setDisplay(0); return }
    const duration = 1200
    const steps = 40
    const increment = value / steps
    let current = 0
    let step = 0
    const timer = setInterval(() => {
      step++
      current = Math.min(Math.round(increment * step), value)
      setDisplay(current)
      if (step >= steps) clearInterval(timer)
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])
  return <span>{prefix}{display.toLocaleString('en-IN')}{suffix}</span>
}

function MiniDonut({ segments, size = 100 }: { segments: { value: number; color: string; label: string }[]; size?: number }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  if (total === 0) {
    return (
      <div
        className="relative flex items-center justify-center rounded-full border-2 border-dashed border-slate-700/60 text-slate-500"
        style={{ width: size, height: size }}
        aria-label="No data yet"
      >
        <span className="text-[10px] tracking-wide uppercase">No data</span>
      </div>
    )
  }
  const r = (size - 12) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r
  let offset = 0

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {segments.map((seg, i) => {
          const pct = seg.value / total
          const dash = pct * circumference
          const currentOffset = offset
          offset += dash
          return (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth="10"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-currentOffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              style={{ opacity: 0.85 }}
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-white">{total}</span>
        <span className="text-[10px] text-slate-400">total</span>
      </div>
    </div>
  )
}

function MiniSparkline({ data, color = '#10b981', height = 32 }: { data: number[]; color?: string; height?: number }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 120
  const step = w / (data.length - 1)
  const points = data.map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ')
  const fillPoints = `0,${height} ${points} ${w},${height}`

  return (
    <svg width={w} height={height} className="opacity-80">
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill={`url(#spark-${color.replace('#', '')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  const buildManualReminderText = (rows: Array<{ member_name: string; phone: string; messages: { message_text: string }[] }>) =>
    rows.slice(0, 20).flatMap((row) => row.messages.map((m) => `${row.member_name} (${row.phone})\n${m.message_text}`)).join('\n\n---\n\n')

  const copyToClipboard = useCallback(async (text: string) => {
    try { await navigator.clipboard.writeText(text); return true } catch { return false }
  }, [])

  const handleSendReminders = async () => {
    try {
      const list = await automationService.getReminderList(7)
      if (!list.expiring.length) { toast('No expiring members in next 7 days'); navigate('/members?status=expiring'); return }
      const reminderText = buildManualReminderText(list.expiring)
      const copied = await copyToClipboard(reminderText)
      toast.success(copied ? `Prepared ${list.expiring.length} renewal follow-ups. Text copied.` : `Prepared ${list.expiring.length} renewal follow-ups.`)
      navigate('/members?status=expiring')
    } catch { toast.error('Could not fetch reminders right now'); navigate('/members?status=expiring') }
  }

  const handleOpenFollowUps = async () => {
    try {
      const list = await automationService.getReminderList(7)
      if (!list.dues.length) toast('No pending dues follow-ups right now')
      else toast.success(`${list.dues.length} members need payment follow-up`)
      navigate('/payments')
    } catch { toast.error('Could not load dues follow-ups'); navigate('/payments') }
  }

  const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ['dashboard-stats'], queryFn: reportService.getDashboardStats })
  const { data: actionCenter } = useQuery({ queryKey: ['action-center'], queryFn: reportService.getActionCenter })
  const { data: revenueOpportunity } = useQuery({ queryKey: ['revenue-opportunity'], queryFn: reportService.getRevenueOpportunity })
  const { data: activityFeed } = useQuery({ queryKey: ['activity-feed'], queryFn: () => reportService.getActivityFeed(15) })
  const { data: biometricSync } = useQuery({ queryKey: ['biometric-sync'], queryFn: () => migrationService.getBiometricSync(), refetchInterval: 60_000 })
  const { data: weekCollection } = useQuery({ queryKey: ['week-collection'], queryFn: () => reportService.getThisWeekCollection() })

  const fmt = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
  const today = format(currentTime, 'EEEE, d MMMM yyyy')
  const timeStr = format(currentTime, 'h:mm a')
  const actionCount = (actionCenter?.expiring_count ?? 0) + (actionCenter?.dues_count ?? 0) + (actionCenter?.inactive_7d_count ?? 0)
  const sparkData = weekCollection?.daily_breakdown?.map((d) => d.amount) ?? []

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-28 rounded-2xl shimmer bg-slate-800/40" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl shimmer bg-slate-800/40" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => <div key={i} className="h-56 rounded-2xl shimmer bg-slate-800/40" />)}
        </div>
      </div>
    )
  }

  const heroStats = [
    {
      label: 'Active Members',
      value: stats?.active_members ?? 0,
      icon: UserCheck,
      color: 'emerald',
      gradient: 'from-emerald-500/20 to-emerald-500/5',
      borderColor: 'border-emerald-500/30',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-400',
      glowClass: 'glow-emerald',
    },
    {
      label: "Today's Check-ins",
      value: stats?.today_check_ins ?? 0,
      icon: Calendar,
      color: 'sky',
      gradient: 'from-sky-500/20 to-sky-500/5',
      borderColor: 'border-sky-500/30',
      iconBg: 'bg-sky-500/10',
      iconColor: 'text-sky-400',
      glowClass: 'glow-sky',
    },
    {
      label: "Today's Revenue",
      value: Number(stats?.today_collection ?? 0),
      icon: IndianRupee,
      color: 'violet',
      gradient: 'from-violet-500/20 to-violet-500/5',
      borderColor: 'border-violet-500/30',
      iconBg: 'bg-violet-500/10',
      iconColor: 'text-violet-400',
      glowClass: 'glow-violet',
      isCurrency: true,
    },
    {
      label: 'New Joins (month)',
      value: stats?.new_joins_this_month ?? 0,
      icon: UserPlus,
      color: 'amber',
      gradient: 'from-amber-500/20 to-amber-500/5',
      borderColor: 'border-amber-500/30',
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-400',
      glowClass: 'glow-amber',
    },
  ]

  const memberSegments = [
    { value: stats?.active_members ?? 0, color: '#10b981', label: 'Active' },
    { value: stats?.expiring_soon ?? 0, color: '#f59e0b', label: 'Expiring' },
    { value: stats?.expired_members ?? 0, color: '#ef4444', label: 'Expired' },
  ]

  const activityIcons: Record<string, typeof Activity> = {
    check_in: UserCheck,
    payment: IndianRupee,
    renewal: Sparkles,
    new_member: UserPlus,
  }
  const activityColors: Record<string, string> = {
    check_in: 'text-sky-400 bg-sky-400/10',
    payment: 'text-emerald-400 bg-emerald-400/10',
    renewal: 'text-violet-400 bg-violet-400/10',
    new_member: 'text-amber-400 bg-amber-400/10',
  }

  return (
    <div className="space-y-8 mesh-gradient min-h-full">

      {/* ═══ HERO HEADER ═══ */}
      <div className="animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400 flex items-center gap-2">
              <span className="status-dot status-dot-live" /> Live Dashboard
            </p>
            <h1 className="text-3xl lg:text-4xl font-bold text-white mt-2 tracking-tight">
              Good {currentTime.getHours() < 12 ? 'morning' : currentTime.getHours() < 17 ? 'afternoon' : 'evening'},{' '}
              <span className="gradient-text">{user?.name?.split(' ')[0] || 'there'}</span>
            </h1>
            <p className="text-slate-400 mt-1">{today} &middot; {timeStr}</p>
          </div>
          {actionCount > 0 && (
            <div className="glass rounded-xl px-4 py-3 flex items-center gap-3 animate-breathe">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{actionCount} action{actionCount > 1 ? 's' : ''} needed</p>
                <p className="text-xs text-slate-400">Scroll down for details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ HERO STAT CARDS ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {heroStats.map((card, i) => (
          <div
            key={card.label}
            className={clsx(
              'relative group rounded-2xl p-5 border transition-all duration-300 hover:scale-[1.02] cursor-default overflow-hidden animate-fade-in-up',
              card.borderColor,
              'bg-gradient-to-br',
              card.gradient,
              `stagger-${i + 1}`,
            )}
          >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ boxShadow: `inset 0 0 60px rgba(0,0,0,0.1)` }} />
            <div className="flex items-start justify-between relative z-10">
              <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', card.iconBg)}>
                <card.icon className={clsx('w-5 h-5', card.iconColor)} />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
            </div>
            <div className="mt-4 relative z-10">
              <p className="text-3xl font-bold text-white animate-count-up">
                {card.isCurrency ? fmt(card.value) : <AnimatedCounter value={card.value} />}
              </p>
              <p className="text-sm text-slate-400 mt-1">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ MAIN GRID: ACTION CENTER + MEMBER OVERVIEW ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Action Center */}
        <div className="lg:col-span-2 animate-fade-in-up stagger-2">
          <div className={clsx(
            'rounded-2xl border overflow-hidden',
            actionCount > 0 ? 'border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent' : 'border-slate-800/60 bg-slate-900/60',
          )}>
            <div className="px-6 py-5 border-b border-slate-800/40">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Target className="w-4 h-4 text-amber-400" />
                </div>
                Action needed today
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {actionCount === 0
                  ? 'All clear. Your gym is running smoothly.'
                  : `${actionCount} item${actionCount === 1 ? '' : 's'} need attention today.`}
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {(actionCenter?.expiring_count ?? 0) > 0 && (
                  <button
                    onClick={() => navigate('/members?status=expiring')}
                    className="glass-light rounded-xl p-4 text-left hover:border-amber-500/30 border border-transparent transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span className="text-xs text-amber-400 font-medium uppercase tracking-wider">Expiring</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{actionCenter?.expiring_count ?? 0}</p>
                    <p className="text-xs text-slate-400 mt-1">memberships expiring soon</p>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 mt-2 transition-colors" />
                  </button>
                )}
                {(actionCenter?.dues_count ?? 0) > 0 && (
                  <button
                    onClick={handleOpenFollowUps}
                    className="glass-light rounded-xl p-4 text-left hover:border-red-500/30 border border-transparent transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-xs text-red-400 font-medium uppercase tracking-wider">Dues</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{actionCenter?.dues_count ?? 0}</p>
                    <p className="text-xs text-slate-400 mt-1">{fmt(Number(actionCenter?.total_dues ?? 0))} pending</p>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-red-400 mt-2 transition-colors" />
                  </button>
                )}
                {(actionCenter?.inactive_7d_count ?? 0) > 0 && (
                  <button
                    onClick={() => navigate('/members')}
                    className="glass-light rounded-xl p-4 text-left hover:border-slate-500/30 border border-transparent transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Inactive</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{actionCenter?.inactive_7d_count ?? 0}</p>
                    <p className="text-xs text-slate-400 mt-1">members inactive 7+ days</p>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 mt-2 transition-colors" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSendReminders}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-500 transition-all hover:shadow-lg hover:shadow-emerald-500/20"
                >
                  <MessageCircle className="w-4 h-4" />
                  Send WhatsApp reminders
                </button>
                <button
                  onClick={handleOpenFollowUps}
                  className="inline-flex items-center gap-2 px-5 py-2.5 glass text-slate-200 rounded-xl font-medium hover:bg-slate-800 transition-all"
                >
                  <Send className="w-4 h-4" />
                  Open follow-ups
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Member Breakdown */}
        <div className="animate-fade-in-up stagger-3">
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 h-full">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-6 flex items-center gap-2">
              <CircleDot className="w-4 h-4 text-emerald-400" />
              Member Breakdown
            </h2>
            <div className="flex items-center justify-center mb-6">
              <MiniDonut segments={memberSegments} size={130} />
            </div>
            <div className="space-y-3">
              {memberSegments.map((seg) => (
                <div key={seg.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                    <span className="text-sm text-slate-300">{seg.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-white">{seg.value}</span>
                </div>
              ))}
              {(stats?.members_with_dues ?? 0) > 0 && (
                <div className="pt-3 mt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">With dues</span>
                    <span className="text-sm font-semibold text-amber-400">{stats?.members_with_dues ?? 0}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ REVENUE + ACTIVITY ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Revenue Opportunity */}
        <div className="animate-fade-in-up stagger-4">
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 overflow-hidden h-full">
            <div className="px-6 py-5 border-b border-slate-800/40">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                Revenue opportunity
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {(revenueOpportunity?.potential_renewals_count ?? 0) > 0 ? (
                <div className="glass-light rounded-xl p-5">
                  <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider mb-2">Potential This Week</p>
                  <p className="text-3xl font-bold text-emerald-400">
                    {fmt(Number(revenueOpportunity?.potential_revenue ?? 0))}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    from {revenueOpportunity?.potential_renewals_count} upcoming renewal{(revenueOpportunity?.potential_renewals_count ?? 0) > 1 ? 's' : ''}
                  </p>
                  <button
                    onClick={() => navigate('/members?status=expiring')}
                    className="mt-4 text-sm font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                  >
                    View expiring members <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="glass-light rounded-xl p-5 text-center">
                  <Shield className="w-8 h-8 text-emerald-400/50 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No immediate renewal opportunities</p>
                </div>
              )}

              {sparkData.length > 1 && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">7-day Collection Trend</p>
                  <MiniSparkline data={sparkData} color="#10b981" height={40} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="glass-light rounded-xl p-4 text-center">
                  <p className="text-xl font-bold text-white">{fmt(Number(stats?.total_dues ?? 0))}</p>
                  <p className="text-xs text-slate-400 mt-1">Total Outstanding</p>
                </div>
                <div className="glass-light rounded-xl p-4 text-center">
                  <p className="text-xl font-bold text-white">{stats?.members_with_dues ?? 0}</p>
                  <p className="text-xs text-slate-400 mt-1">Members with Dues</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="animate-fade-in-up stagger-5">
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 overflow-hidden h-full flex flex-col">
            <div className="px-6 py-5 border-b border-slate-800/40 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-sky-400" />
                </div>
                Live Activity
              </h2>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="status-dot status-dot-live" />
                Real-time
              </span>
            </div>
            <div className="flex-1 overflow-y-auto max-h-96">
              {!activityFeed?.length ? (
                <div className="px-6 py-12 text-center">
                  <Eye className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No activity yet today</p>
                  <p className="text-xs text-slate-600 mt-1">Activity will appear as members check in</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/40">
                  {activityFeed.map((item, i) => {
                    const Icon = activityIcons[item.type] || Activity
                    const colorClass = activityColors[item.type] || 'text-slate-400 bg-slate-400/10'
                    return (
                      <div
                        key={`${item.type}-${item.time}-${i}`}
                        className="px-6 py-3.5 hover:bg-slate-800/30 transition-colors animate-fade-in-up"
                        style={{ animationDelay: `${i * 0.03}s` }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', colorClass)}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-200 truncate">{item.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {item.subtitle} &middot; {format(new Date(item.time), 'h:mm a')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ ATTENDANCE INTELLIGENCE ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="animate-fade-in-up stagger-4">
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-800/40">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-violet-400" />
                </div>
                Attendance Intelligence
              </h2>
              <p className="text-sm text-slate-400 mt-1">Members not visiting recently</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between glass-light rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 rounded-full bg-amber-500/60" />
                  <div>
                    <p className="text-sm font-medium text-slate-200">7 days inactive</p>
                    <p className="text-xs text-slate-500">May need a nudge</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-white">{actionCenter?.inactive_7d_count ?? 0}</span>
              </div>
              <div className="flex items-center justify-between glass-light rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 rounded-full bg-red-500/60" />
                  <div>
                    <p className="text-sm font-medium text-slate-200">14 days inactive</p>
                    <p className="text-xs text-slate-500">At risk of churning</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-white">{actionCenter?.inactive_14d_count ?? 0}</span>
              </div>
              <button
                onClick={() => navigate('/members')}
                className="w-full flex items-center justify-center gap-2 mt-2 px-4 py-3 glass text-slate-200 rounded-xl font-medium hover:bg-slate-800 transition-all"
              >
                <Send className="w-4 h-4" />
                Send comeback message
              </button>
            </div>
          </div>
        </div>

        {/* Biometric Sync */}
        <div className="animate-fade-in-up stagger-5">
          {biometricSync && biometricSync.total_devices > 0 ? (
            <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 overflow-hidden h-full">
              <div className="px-6 py-5 border-b border-slate-800/40">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Wifi className="w-4 h-4 text-emerald-400" />
                  </div>
                  Biometric Sync
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="glass-light rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-emerald-400">{biometricSync.active_devices}</p>
                    <p className="text-xs text-slate-400 mt-1">Active</p>
                  </div>
                  <div className="glass-light rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-white">{biometricSync.total_mapped_members}</p>
                    <p className="text-xs text-slate-400 mt-1">Synced</p>
                  </div>
                  <div className="glass-light rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-white">
                      {biometricSync.last_event_at ? format(new Date(biometricSync.last_event_at), 'h:mm a') : '--'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Last Sync</p>
                  </div>
                  <div className="glass-light rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-white">{biometricSync.total_devices}</p>
                    <p className="text-xs text-slate-400 mt-1">Devices</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {biometricSync.devices.map((dev) => (
                    <div key={dev.device_id} className="flex items-center justify-between glass-light rounded-lg px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        {dev.is_active ? (
                          <span className="status-dot status-dot-live" />
                        ) : (
                          <WifiOff className="w-3.5 h-3.5 text-slate-500" />
                        )}
                        <span className="text-sm font-medium text-slate-200">{dev.device_name}</span>
                        <span className="text-xs text-slate-500">{dev.vendor}</span>
                      </div>
                      <span className="text-xs text-slate-400">{dev.events_last_24h} events</span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/settings/biometric')}
                  className="mt-4 w-full text-sm font-medium text-emerald-400 hover:text-emerald-300 flex items-center justify-center gap-1"
                >
                  Manage biometric <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-8 h-full flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mb-4">
                <Wifi className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-300">Biometric Integration</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-xs">
                Connect your biometric devices for automated check-ins and real-time attendance tracking.
              </p>
              <button
                onClick={() => navigate('/settings/biometric')}
                className="mt-4 text-sm font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
              >
                Set up devices <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══ BOTTOM STRIP ═══ */}
      <div className="animate-fade-in-up stagger-6">
        <div className="rounded-2xl glass px-6 py-4 flex flex-wrap items-center gap-6">
          <span className="text-sm font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Powered by ActiveHQ
          </span>
          <span className="flex items-center gap-2 text-sm text-slate-400">
            <MessageCircle className="w-4 h-4 text-emerald-400/60" />
            WhatsApp Reminders
          </span>
          <span className="flex items-center gap-2 text-sm text-slate-400">
            <TrendingUp className="w-4 h-4 text-amber-400/60" />
            Smart Automation
          </span>
          <span className="flex items-center gap-2 text-sm text-slate-400">
            <Shield className="w-4 h-4 text-violet-400/60" />
            Enterprise Security
          </span>
        </div>
      </div>
    </div>
  )
}
