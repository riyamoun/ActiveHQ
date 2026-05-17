import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { memberService } from '@/services/memberService'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { Plus, Search, Users } from 'lucide-react'
import { format } from 'date-fns'
import type { MemberSummary } from '@/types'

function membershipBadge(member: MemberSummary) {
  if (!member.is_active) {
    return {
      label: 'Inactive',
      className: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
    }
  }
  if (!member.current_membership_status) {
    return {
      label: 'No plan',
      className: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
    }
  }
  if (member.current_membership_status === 'expired') {
    return {
      label: 'Expired',
      className: 'bg-red-500/10 text-red-300 border border-red-500/20',
    }
  }
  if (member.current_membership_status === 'paused') {
    return {
      label: 'Paused',
      className: 'bg-blue-500/10 text-blue-300 border border-blue-500/20',
    }
  }
  if (member.current_membership_status === 'cancelled') {
    return {
      label: 'Cancelled',
      className: 'bg-slate-500/10 text-slate-300 border border-slate-500/20',
    }
  }
  return {
    label: 'Active',
    className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  }
}

export default function MembersPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [search, setSearch] = useState(searchParams.get('query') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['members', search, statusFilter, page],
    queryFn: () =>
      memberService.getMembers({
        query: search || undefined,
        status: statusFilter || undefined,
        page,
        page_size: 20,
      }),
  })

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
    setPage(1)
    if (status) {
      setSearchParams({ status })
    } else {
      setSearchParams({})
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            Members
          </h1>
          <p className="text-slate-400 mt-1">Manage your gym members</p>
        </div>
        <button
          onClick={() => navigate('/members/add')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, phone, or code..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-slate-800/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/40 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {['', 'active', 'expiring', 'expired'].map((status) => (
            <button
              key={status}
              onClick={() => handleStatusFilter(status)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/60 border border-slate-700/40'
              }`}
            >
              {status === '' ? 'All' : status === 'active' ? 'Active' : status === 'expiring' ? 'Expiring' : 'Expired'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : (
        <>
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800/60">
                  <th className="text-left px-6 py-4 text-xs text-slate-500 uppercase tracking-wider font-medium">Member</th>
                  <th className="text-left px-6 py-4 text-xs text-slate-500 uppercase tracking-wider font-medium">Code</th>
                  <th className="text-left px-6 py-4 text-xs text-slate-500 uppercase tracking-wider font-medium">Joined</th>
                  <th className="text-left px-6 py-4 text-xs text-slate-500 uppercase tracking-wider font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {data?.items?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">No members found</td>
                  </tr>
                ) : (
                  data?.items?.map((member: MemberSummary) => {
                    const badge = membershipBadge(member)
                    return (
                      <tr
                        key={member.id}
                        onClick={() => navigate(`/members/${member.id}`)}
                        className="hover:bg-slate-800/30 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-white">{member.name}</p>
                          <p className="text-sm text-slate-500">{member.phone}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-400">{member.member_code || '-'}</td>
                        <td className="px-6 py-4 text-slate-400">{format(new Date(member.joined_date), 'dd MMM yyyy')}</td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${badge.className}`}>
                              {badge.label}
                            </span>
                            {member.current_membership_end && (
                              <p className="text-xs text-slate-500">
                                till {format(new Date(member.current_membership_end), 'dd MMM yyyy')}
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {data && data.total_pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.total)} of {data.total} members
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-slate-700 rounded-xl text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                  disabled={page === data.total_pages}
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
