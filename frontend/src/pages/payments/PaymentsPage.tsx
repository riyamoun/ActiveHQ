import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { paymentService } from '@/services/paymentService'
import Card, { CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import StatCard from '@/components/ui/StatCard'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { IndianRupee, Banknote, CreditCard, Smartphone, Calendar } from 'lucide-react'
import { format, subDays } from 'date-fns'
import type { PaymentMode } from '@/types'

export default function PaymentsPage() {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today')
  const [page, setPage] = useState(1)

  const getDateRange = () => {
    const today = new Date()
    switch (dateRange) {
      case 'today':
        return { from: format(today, 'yyyy-MM-dd'), to: format(today, 'yyyy-MM-dd') }
      case 'week':
        return { from: format(subDays(today, 7), 'yyyy-MM-dd'), to: format(today, 'yyyy-MM-dd') }
      case 'month':
        return { from: format(subDays(today, 30), 'yyyy-MM-dd'), to: format(today, 'yyyy-MM-dd') }
    }
  }

  const { from, to } = getDateRange()

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['payments', from, to, page],
    queryFn: () =>
      paymentService.getPayments({
        from_date: from,
        to_date: to,
        page,
        page_size: 20,
      }),
  })

  const { data: todayCollection } = useQuery({
    queryKey: ['daily-collection'],
    queryFn: () => paymentService.getDailyCollection(),
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getModeIcon = (mode: PaymentMode) => {
    switch (mode) {
      case 'cash':
        return <Banknote className="w-4 h-4" />
      case 'upi':
        return <Smartphone className="w-4 h-4" />
      case 'card':
        return <CreditCard className="w-4 h-4" />
      default:
        return <IndianRupee className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-gray-500">Track all payment transactions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Collection"
          value={formatCurrency(todayCollection?.total_amount || 0)}
          icon={<IndianRupee className="w-6 h-6" />}
          variant="success"
        />
        <StatCard
          title="Cash"
          value={formatCurrency(todayCollection?.by_mode?.cash || 0)}
          icon={<Banknote className="w-6 h-6" />}
          variant="default"
        />
        <StatCard
          title="UPI"
          value={formatCurrency(todayCollection?.by_mode?.upi || 0)}
          icon={<Smartphone className="w-6 h-6" />}
          variant="primary"
        />
        <StatCard
          title="Transactions"
          value={todayCollection?.payment_count || 0}
          icon={<Calendar className="w-6 h-6" />}
          variant="default"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['today', 'week', 'month'] as const).map((range) => (
          <button
            key={range}
            onClick={() => {
              setDateRange(range)
              setPage(1)
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dateRange === range
                ? 'bg-primary-100 text-primary-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {range === 'today' ? 'Today' : range === 'week' ? 'Last 7 Days' : 'Last 30 Days'}
          </button>
        ))}
      </div>

      {/* Payments Table */}
      {paymentsLoading ? (
        <PageLoader />
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Mode
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments?.items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No payments found for this period
                    </td>
                  </tr>
                ) : (
                  payments?.items.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {format(new Date(payment.payment_date), 'dd MMM yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{payment.member_name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(payment.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="info" className="inline-flex items-center gap-1">
                          {getModeIcon(payment.payment_mode)}
                          {payment.payment_mode.toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Summary footer */}
          {payments && payments.items.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {payments.total} transactions
                </span>
                <span className="font-semibold text-gray-900">
                  Total: {formatCurrency(payments.total_amount)}
                </span>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
