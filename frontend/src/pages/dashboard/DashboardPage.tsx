import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { reportService } from '@/services/reportService'
import { automationService } from '@/services/automationService'
import { migrationService } from '@/services/migrationService'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import {
  Users,
  UserCheck,
  IndianRupee,
  Calendar,
  MessageCircle,
  ArrowRight,
  Clock,
  AlertTriangle,
  TrendingUp,
  Activity,
  UserPlus,
  Send,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const navigate = useNavigate()
  
  const buildManualReminderText = (rows: Array<{ member_name: string; phone: string; messages: { message_text: string }[] }>) => {
    return rows
      .slice(0, 20)
      .flatMap((row) =>
        row.messages.map(
          (m) => `${row.member_name} (${row.phone})\n${m.message_text}`
        )
      )
      .join('\n\n---\n\n')
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      return false
    }
  }

  const handleSendReminders = async () => {
    try {
      const list = await automationService.getReminderList(7)
      if (!list.expiring.length) {
        toast('No expiring members in next 7 days')
        navigate('/members?status=expiring')
        return
      }
      const reminderText = buildManualReminderText(list.expiring)
      const copied = await copyToClipboard(reminderText)
      if (copied) {
        toast.success(`Prepared ${list.expiring.length} renewal follow-ups. Text copied.`)
      } else {
        toast.success(`Prepared ${list.expiring.length} renewal follow-ups.`)
      }
      navigate('/members?status=expiring')
    } catch {
      toast.error('Could not fetch reminders right now')
      navigate('/members?status=expiring')
    }
  }

  const handleOpenFollowUps = async () => {
    try {
      const list = await automationService.getReminderList(7)
      if (!list.dues.length) {
        toast('No pending dues follow-ups right now')
      } else {
        toast.success(`${list.dues.length} members need payment follow-up`)
      }
      navigate('/payments')
    } catch {
      toast.error('Could not load dues follow-ups')
      navigate('/payments')
    }
  }

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: reportService.getDashboardStats,
  })

  const { data: actionCenter } = useQuery({
    queryKey: ['action-center'],
    queryFn: reportService.getActionCenter,
  })

  const { data: revenueOpportunity } = useQuery({
    queryKey: ['revenue-opportunity'],
    queryFn: reportService.getRevenueOpportunity,
  })

  const { data: activityFeed } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: () => reportService.getActivityFeed(15),
  })

  const { data: biometricSync } = useQuery({
    queryKey: ['biometric-sync'],
    queryFn: () => migrationService.getBiometricSync(),
    refetchInterval: 60_000,
  })

  if (statsLoading) {
    return <PageLoader />
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)

  const today = format(new Date(), 'EEEE, d MMMM yyyy')
  const actionCount =
    (actionCenter?.expiring_count ?? 0) +
    (actionCenter?.dues_count ?? 0) +
    (actionCenter?.inactive_7d_count ?? 0)

  return (
    <div className="space-y-10">
      {/* 1. Hero */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-semibold text-slate-900 tracking-tight">
          Today's gym snapshot
        </h1>
        <p className="text-slate-500 mt-1">{today}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {[
            { label: 'Active Members', value: stats?.active_members ?? 0, icon: UserCheck, iconClass: 'bg-emerald-100 text-emerald-600' },
            { label: "Today's Check-ins", value: stats?.today_check_ins ?? 0, icon: Calendar, iconClass: 'bg-blue-100 text-blue-600' },
            { label: "Today's Revenue", value: formatCurrency(Number(stats?.today_collection ?? 0)), icon: IndianRupee, iconClass: 'bg-emerald-100 text-emerald-600' },
            { label: 'New Joins (month)', value: stats?.new_joins_this_month ?? 0, icon: UserPlus, iconClass: 'bg-slate-100 text-slate-600' },
          ].map((card, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.iconClass}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-semibold text-slate-900 mt-3">{card.value}</p>
              <p className="text-sm text-slate-500">{card.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Action Center — most important */}
      <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/80 overflow-hidden">
        <div className="px-6 py-5 border-b border-amber-200/80">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-600" />
            Action needed today
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            {actionCount === 0
              ? 'Nothing urgent. You’re on top of things.'
              : `${actionCount} item${actionCount === 1 ? '' : 's'} need your attention.`}
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {(actionCenter?.expiring_count ?? 0) > 0 && (
              <div className="bg-white rounded-xl p-4 border border-amber-200">
                <Clock className="w-5 h-5 text-amber-600 mb-2" />
                <p className="text-2xl font-semibold text-slate-900">{actionCenter?.expiring_count ?? 0}</p>
                <p className="text-sm text-slate-600">memberships expiring → Send reminder</p>
              </div>
            )}
            {(actionCenter?.dues_count ?? 0) > 0 && (
              <div className="bg-white rounded-xl p-4 border border-red-200">
                <AlertTriangle className="w-5 h-5 text-red-600 mb-2" />
                <p className="text-2xl font-semibold text-slate-900">{actionCenter?.dues_count ?? 0}</p>
                <p className="text-sm text-slate-600">
                  {formatCurrency(Number(actionCenter?.total_dues ?? 0))} pending → Follow up
                </p>
              </div>
            )}
            {(actionCenter?.inactive_7d_count ?? 0) > 0 && (
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <Users className="w-5 h-5 text-slate-600 mb-2" />
                <p className="text-2xl font-semibold text-slate-900">{actionCenter?.inactive_7d_count ?? 0}</p>
                <p className="text-sm text-slate-600">members inactive 7+ days → Re-engage</p>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSendReminders}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Send WhatsApp reminders
            </button>
            <button
              onClick={handleOpenFollowUps}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-colors"
            >
              Open follow-ups
            </button>
          </div>
        </div>
      </div>

      {/* 3. Revenue opportunity */}
      {(revenueOpportunity?.potential_renewals_count ?? 0) > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Revenue opportunity
          </h2>
          <p className="text-sm text-slate-500 mt-1">Potential renewals this week</p>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-emerald-600">
              {formatCurrency(Number(revenueOpportunity?.potential_revenue ?? 0))}
            </span>
            <span className="text-slate-500">
              from {revenueOpportunity?.potential_renewals_count ?? 0} membership
              {(revenueOpportunity?.potential_renewals_count ?? 0) === 1 ? '' : 's'}
            </span>
          </div>
          <button
            onClick={() => navigate('/members?status=expiring')}
            className="mt-3 text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            View expiring <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4. Attendance intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Members not visited recently</h2>
            <p className="text-sm text-slate-500">Re-engage with a comeback message</p>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">7 days:</span>
              <span className="font-semibold text-slate-900">{actionCenter?.inactive_7d_count ?? 0} members</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">14 days:</span>
              <span className="font-semibold text-slate-900">{actionCenter?.inactive_14d_count ?? 0} members</span>
            </div>
            <button
              onClick={() => navigate('/members')}
              className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
            >
              <Send className="w-4 h-4" />
              Send comeback message
            </button>
          </div>
        </div>

        {/* 5. Live activity feed */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Live activity
            </h2>
            <p className="text-sm text-slate-500">Recent check-ins, payments & joins</p>
          </div>
          <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
            {!activityFeed?.length ? (
              <div className="px-6 py-8 text-center text-slate-500">No recent activity</div>
            ) : (
              activityFeed.map((item, i) => (
                <div
                  key={`${item.type}-${item.time}-${i}`}
                  className="px-6 py-3 hover:bg-slate-50/80 transition-colors"
                >
                  <p className="font-medium text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {item.subtitle} · {format(new Date(item.time), 'MMM d, h:mm a')}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 6. Biometric sync status */}
      {biometricSync && biometricSync.total_devices > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <Wifi className="w-5 h-5 text-emerald-600" />
            Biometric Sync Status
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{biometricSync.active_devices}</p>
              <p className="text-xs text-slate-500">Active Devices</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{biometricSync.total_mapped_members}</p>
              <p className="text-xs text-slate-500">Members Synced</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">
                {biometricSync.last_event_at
                  ? format(new Date(biometricSync.last_event_at), 'h:mm a')
                  : '--'}
              </p>
              <p className="text-xs text-slate-500">Last Sync</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{biometricSync.total_devices}</p>
              <p className="text-xs text-slate-500">Total Devices</p>
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {biometricSync.devices.map(dev => (
              <div key={dev.device_id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {dev.is_active ? <Wifi className="w-3.5 h-3.5 text-emerald-500" /> : <WifiOff className="w-3.5 h-3.5 text-slate-400" />}
                  <span className="text-sm font-medium text-slate-800">{dev.device_name}</span>
                  <span className="text-xs text-slate-400">{dev.vendor}</span>
                </div>
                <span className="text-xs text-slate-500">{dev.events_last_24h} events (24h)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Short differentiator strip */}
      <div className="rounded-xl bg-slate-900 px-5 py-3 flex flex-wrap items-center gap-4 text-white/90 text-sm">
        <span className="font-medium text-white">Included with ActiveHQ</span>
        <span className="flex items-center gap-1.5">
          <MessageCircle className="w-4 h-4 text-emerald-400" />
          WhatsApp reminders
        </span>
        <span className="flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-amber-400" />
          Renewal & payment automation
        </span>
      </div>
    </div>
  )
}
