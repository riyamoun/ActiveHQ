import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { paymentService } from '@/services/paymentService'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { IndianRupee, Banknote, CreditCard, Smartphone, Calendar } from 'lucide-react'
import { format, subDays } from 'date-fns'
import type { PaymentMode } from '@/types'

export default function PaymentsPage() {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today')
  const [page, setPage] = useState(1)
  const pageSize = 20

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
        page_size: pageSize,
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

  const totalPages =
    payments && payments.total > 0 ? Math.ceil(payments.total / (payments.page_size || pageSize)) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-emerald-400" />
          </div>
          Payments
        </h1>
        <p className="text-slate-400 mt-1">Track all payment transactions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Today&apos;s Collection</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatCurrency(todayCollection?.total_amount || 0)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
              <IndianRupee className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Cash</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatCurrency(todayCollection?.by_mode?.cash || 0)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 text-slate-400">
              <Banknote className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">UPI</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatCurrency(todayCollection?.by_mode?.upi || 0)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 text-slate-400">
              <Smartphone className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Transactions</p>
              <p className="text-2xl font-bold text-white mt-1">{todayCollection?.payment_count || 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 text-slate-400">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['today', 'week', 'month'] as const).map((range) => (
          <button
            key={range}
            onClick={() => {
              setDateRange(range)
              setPage(1)
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              dateRange === range
                ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800/30'
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
        <>
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800/60 bg-slate-800/60">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Mode
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {payments?.items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                        No payments found for this period
                      </td>
                    </tr>
                  ) : (
                    payments?.items.map((payment) => (
                      <tr key={payment.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {format(new Date(payment.payment_date), 'dd MMM yyyy')}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-white">{payment.member_name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-white">{formatCurrency(payment.amount)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {getModeIcon(payment.payment_mode)}
                            {payment.payment_mode.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary footer */}
            {payments && payments.items.length > 0 && (
              <div className="px-6 py-4 bg-slate-800/60 border-t border-slate-800/60">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">{payments.total} transactions</span>
                  <span className="font-semibold text-white">
                    Total: {formatCurrency(payments.total_amount)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {payments && totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, payments.total)} of{' '}
                {payments.total} payments
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-slate-700 rounded-xl text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-slate-700 rounded-xl text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
