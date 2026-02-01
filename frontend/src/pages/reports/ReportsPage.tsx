import { useQuery } from '@tanstack/react-query'
import { reportService } from '@/services/reportService'
import Card, { CardHeader } from '@/components/ui/Card'
import StatCard from '@/components/ui/StatCard'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import {
  Users,
  UserCheck,
  Clock,
  AlertTriangle,
  IndianRupee,
  TrendingUp,
  Calendar,
} from 'lucide-react'
import { format } from 'date-fns'

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500">Business analytics and insights</p>
      </div>

      {/* Member Stats */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Member Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Members"
            value={dashboard?.total_members || 0}
            icon={<Users className="w-6 h-6" />}
            variant="primary"
          />
          <StatCard
            title="Active Members"
            value={dashboard?.active_members || 0}
            icon={<UserCheck className="w-6 h-6" />}
            variant="success"
          />
          <StatCard
            title="Expired Members"
            value={dashboard?.expired_members || 0}
            icon={<AlertTriangle className="w-6 h-6" />}
            variant="danger"
          />
          <StatCard
            title="Expiring This Week"
            value={membershipStats?.expiring_this_week || 0}
            icon={<Clock className="w-6 h-6" />}
            variant="warning"
          />
        </div>
      </div>

      {/* Collection Stats */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Collection Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Today's Collection"
            value={formatCurrency(dashboard?.today_collection || 0)}
            icon={<IndianRupee className="w-6 h-6" />}
            variant="success"
          />
          <StatCard
            title="This Week"
            value={formatCurrency(weekCollection?.total_amount || 0)}
            icon={<Calendar className="w-6 h-6" />}
            variant="primary"
          />
          <StatCard
            title="This Month"
            value={formatCurrency(monthCollection?.total_amount || 0)}
            icon={<TrendingUp className="w-6 h-6" />}
            variant="primary"
          />
          <StatCard
            title="Total Dues"
            value={formatCurrency(dashboard?.total_dues || 0)}
            icon={<AlertTriangle className="w-6 h-6" />}
            variant="danger"
          />
        </div>
      </div>

      {/* Membership Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Membership Status" subtitle="Current membership breakdown" />
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <span className="text-green-800">Active</span>
              <span className="text-2xl font-bold text-green-800">
                {membershipStats?.total_active || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <span className="text-yellow-800">Paused</span>
              <span className="text-2xl font-bold text-yellow-800">
                {membershipStats?.total_paused || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <span className="text-red-800">Expired</span>
              <span className="text-2xl font-bold text-red-800">
                {membershipStats?.total_expired || 0}
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Payment Mode Distribution" subtitle="This month's payments" />
          <div className="space-y-4">
            {monthCollection?.by_mode && Object.entries(monthCollection.by_mode).length > 0 ? (
              Object.entries(monthCollection.by_mode).map(([mode, amount]) => (
                <div
                  key={mode}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <span className="text-gray-700 uppercase">{mode}</span>
                  <span className="text-xl font-bold text-gray-900">
                    {formatCurrency(amount)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No payments this month</p>
            )}
          </div>
        </Card>
      </div>

      {/* Daily Collection Chart (simplified) */}
      {monthCollection?.daily_breakdown && monthCollection.daily_breakdown.length > 0 && (
        <Card>
          <CardHeader title="Daily Collection" subtitle="Last 30 days" />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-xs font-semibold text-gray-600 uppercase">
                    Date
                  </th>
                  <th className="text-right py-2 text-xs font-semibold text-gray-600 uppercase">
                    Amount
                  </th>
                  <th className="text-right py-2 text-xs font-semibold text-gray-600 uppercase">
                    Transactions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {monthCollection.daily_breakdown.slice(-10).reverse().map((day) => (
                  <tr key={day.date}>
                    <td className="py-2 text-gray-600">
                      {format(new Date(day.date), 'dd MMM')}
                    </td>
                    <td className="py-2 text-right font-medium">
                      {formatCurrency(day.amount)}
                    </td>
                    <td className="py-2 text-right text-gray-500">{day.count}</td>
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
