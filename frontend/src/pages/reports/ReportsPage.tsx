import { useQuery } from '@tanstack/react-query'
import { reportService } from '@/services/reportService'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import {
  Users,
  UserCheck,
  Clock,
  AlertTriangle,
  IndianRupee,
  TrendingUp,
  Calendar,
  BarChart3,
} from 'lucide-react'
import { format } from 'date-fns'
import clsx from 'clsx'

type StatVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger'

const statIconVariants: Record<StatVariant, string> = {
  default: 'bg-slate-800/60 text-slate-400',
  primary: 'bg-emerald-500/10 text-emerald-400',
  success: 'bg-emerald-500/10 text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-400',
  danger: 'bg-red-500/10 text-red-400',
}

function ReportStatCard({
  title,
  value,
  icon,
  variant = 'default',
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  variant?: StatVariant
}) {
  return (
    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={clsx('p-3 rounded-xl', statIconVariants[variant])}>{icon}</div>
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: reportService.getDashboardStats,
  })

  const { data: membershipStats } = useQuery({
    queryKey: ['membership-stats'],
    queryFn: reportService.getMembershipStats,
  })

  const { data: monthCollection } = useQuery({
    queryKey: ['month-collection'],
    queryFn: reportService.getThisMonthCollection,
  })

  const { data: weekCollection } = useQuery({
    queryKey: ['week-collection'],
    queryFn: reportService.getThisWeekCollection,
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (dashboardLoading) {
    return <PageLoader />
  }

  const cardClass = 'rounded-2xl border border-slate-800/60 bg-slate-900/60 shadow-none'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
          <BarChart3 className="h-5 w-5 text-amber-400" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-slate-400">Business analytics and insights</p>
        </div>
      </div>

      {/* Member Stats */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Member Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ReportStatCard
            title="Total Members"
            value={dashboard?.total_members || 0}
            icon={<Users className="w-6 h-6" />}
            variant="primary"
          />
          <ReportStatCard
            title="Active Members"
            value={dashboard?.active_members || 0}
            icon={<UserCheck className="w-6 h-6" />}
            variant="success"
          />
          <ReportStatCard
            title="Expired Members"
            value={dashboard?.expired_members || 0}
            icon={<AlertTriangle className="w-6 h-6" />}
            variant="danger"
          />
          <ReportStatCard
            title="Expiring This Week"
            value={membershipStats?.expiring_this_week || 0}
            icon={<Clock className="w-6 h-6" />}
            variant="warning"
          />
        </div>
      </div>

      {/* Collection Stats */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Collection Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ReportStatCard
            title="Today's Collection"
            value={formatCurrency(dashboard?.today_collection || 0)}
            icon={<IndianRupee className="w-6 h-6" />}
            variant="success"
          />
          <ReportStatCard
            title="This Week"
            value={formatCurrency(weekCollection?.total_amount || 0)}
            icon={<Calendar className="w-6 h-6" />}
            variant="primary"
          />
          <ReportStatCard
            title="This Month"
            value={formatCurrency(monthCollection?.total_amount || 0)}
            icon={<TrendingUp className="w-6 h-6" />}
            variant="primary"
          />
          <ReportStatCard
            title="Total Dues"
            value={formatCurrency(dashboard?.total_dues || 0)}
            icon={<AlertTriangle className="w-6 h-6" />}
            variant="danger"
          />
        </div>
      </div>

      {/* Membership Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className={cardClass}>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Membership Status</h3>
            <p className="text-sm text-slate-400 mt-0.5">Current membership breakdown</p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-slate-800/60 bg-slate-800/60 p-4">
              <Badge className="border-0 bg-emerald-500/10 text-emerald-400">Active</Badge>
              <span className="text-2xl font-bold text-white">
                {membershipStats?.total_active || 0}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-800/60 bg-slate-800/60 p-4">
              <Badge className="border-0 bg-amber-500/10 text-amber-400">Paused</Badge>
              <span className="text-2xl font-bold text-white">
                {membershipStats?.total_paused || 0}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-800/60 bg-slate-800/60 p-4">
              <Badge className="border-0 bg-red-500/10 text-red-400">Expired</Badge>
              <span className="text-2xl font-bold text-white">
                {membershipStats?.total_expired || 0}
              </span>
            </div>
          </div>
        </Card>

        <Card className={cardClass}>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Payment Mode Distribution</h3>
            <p className="text-sm text-slate-400 mt-0.5">This month&apos;s payments</p>
          </div>
          <div className="space-y-4">
            {monthCollection?.by_mode && Object.entries(monthCollection.by_mode).length > 0 ? (
              Object.entries(monthCollection.by_mode).map(([mode, amount]) => (
                <div
                  key={mode}
                  className="flex items-center justify-between rounded-lg border border-slate-800/60 bg-slate-800/60 p-4"
                >
                  <Badge className="border-0 bg-slate-800/80 text-slate-300 uppercase">
                    {mode}
                  </Badge>
                  <span className="text-xl font-bold text-white">{formatCurrency(amount)}</span>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-400 py-4">No payments this month</p>
            )}
          </div>
        </Card>
      </div>

      {/* Daily Collection Chart (simplified) */}
      {monthCollection?.daily_breakdown && monthCollection.daily_breakdown.length > 0 && (
        <Card className={cardClass}>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Daily Collection</h3>
            <p className="text-sm text-slate-400 mt-0.5">Last 30 days</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800/60">
                  <th className="text-left py-2 text-xs font-semibold text-slate-400 uppercase">
                    Date
                  </th>
                  <th className="text-right py-2 text-xs font-semibold text-slate-400 uppercase">
                    Amount
                  </th>
                  <th className="text-right py-2 text-xs font-semibold text-slate-400 uppercase">
                    Transactions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {monthCollection.daily_breakdown
                  .slice(-10)
                  .reverse()
                  .map((day) => (
                    <tr key={day.date} className="hover:bg-slate-800/30">
                      <td className="py-2 text-slate-400">{format(new Date(day.date), 'dd MMM')}</td>
                      <td className="py-2 text-right font-medium text-white">
                        {formatCurrency(day.amount)}
                      </td>
                      <td className="py-2 text-right text-slate-400">{day.count}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
