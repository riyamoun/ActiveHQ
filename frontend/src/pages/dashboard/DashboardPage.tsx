import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { reportService } from '@/services/reportService'
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
} from 'lucide-react'
import { format } from 'date-fns'

export default function DashboardPage() {
  const navigate = useNavigate()

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
                <p className="text-2xl font-semibold text-slate-900">{actionCenter.expiring_count}</p>
                <p className="text-sm text-slate-600">memberships expiring → Send reminder</p>
              </div>
            )}
            {(actionCenter?.dues_count ?? 0) > 0 && (
              <div className="bg-white rounded-xl p-4 border border-red-200">
                <AlertTriangle className="w-5 h-5 text-red-600 mb-2" />
                <p className="text-2xl font-semibold text-slate-900">{actionCenter.dues_count}</p>
                <p className="text-sm text-slate-600">
                  {formatCurrency(Number(actionCenter.total_dues ?? 0))} pending → Follow up
                </p>
              </div>
            )}
            {(actionCenter?.inactive_7d_count ?? 0) > 0 && (
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <Users className="w-5 h-5 text-slate-600 mb-2" />
                <p className="text-2xl font-semibold text-slate-900">{actionCenter.inactive_7d_count}</p>
                <p className="text-sm text-slate-600">members inactive 7+ days → Re-engage</p>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/members?status=expiring')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Send WhatsApp reminders
            </button>
            <button
              onClick={() => navigate('/payments')}
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
              {formatCurrency(Number(revenueOpportunity.potential_revenue ?? 0))}
            </span>
            <span className="text-slate-500">
              from {revenueOpportunity.potential_renewals_count} membership
              {revenueOpportunity.potential_renewals_count === 1 ? '' : 's'}
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
