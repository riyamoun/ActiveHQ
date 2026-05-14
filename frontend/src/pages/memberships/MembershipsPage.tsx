import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import { membershipService } from '@/services/membershipService'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { format } from 'date-fns'
import type { MembershipStatus } from '@/types'

export default function MembershipsPage() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<MembershipStatus | ''>('')
  const [page, setPage] = useState(1)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['memberships', statusFilter, page],
    queryFn: () =>
      membershipService.getMemberships({
        status: statusFilter || undefined,
        page,
        page_size: 20,
      }),
  })

  const getStatusBadge = (status: MembershipStatus) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>
      case 'expired':
        return <Badge variant="danger">Expired</Badge>
      case 'paused':
        return <Badge variant="warning">Paused</Badge>
      case 'cancelled':
        return <Badge variant="gray">Cancelled</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
          <ClipboardList className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Memberships</h1>
          <p className="text-slate-400">Track all membership subscriptions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['', 'active', 'expired', 'paused', 'cancelled'] as const).map((status) => (
          <button
            key={status}
            onClick={() => {
              setStatusFilter(status)
              setPage(1)
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800/30'
            }`}
          >
            {status === '' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <PageLoader />
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-800/60 border-b border-slate-800/60">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase">
                    Amount Due
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {isError ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-rose-400">
                      Could not load memberships. Please retry.
                    </td>
                  </tr>
                ) : !data?.items?.length ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      No memberships found
                    </td>
                  </tr>
                ) : (
                  data.items.map((membership) => (
                    <tr
                      key={membership.id}
                      className="hover:bg-slate-800/30 cursor-pointer"
                      onClick={() => navigate(`/members/${membership.member_id}`)}
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-white">{membership.member_name}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-400">{membership.plan_name}</td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {format(new Date(membership.start_date), 'dd MMM')} -{' '}
                        {format(new Date(membership.end_date), 'dd MMM yyyy')}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(membership.status)}</td>
                      <td className="px-6 py-4">
                        {membership.amount_due > 0 ? (
                          <span className="font-medium text-red-400">
                            {formatCurrency(membership.amount_due)}
                          </span>
                        ) : (
                          <span className="text-emerald-400">Paid</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {data && data.total > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.total)} of{' '}
            {data.total} memberships
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 20 >= data.total}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
