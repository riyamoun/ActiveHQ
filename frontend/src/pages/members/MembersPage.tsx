import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { memberService } from '@/services/memberService'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { Plus, Search } from 'lucide-react'
import { format } from 'date-fns'
import type { MemberSummary } from '@/types'

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light text-slate-900">
            <span className="font-medium">Members</span>
          </h1>
          <p className="text-slate-500">Manage your gym members</p>
        </div>
        <button
          onClick={() => navigate('/members/add')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-full hover:bg-emerald-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone, or code..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {['', 'active', 'expired'].map((status) => (
            <button
              key={status}
              onClick={() => handleStatusFilter(status)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === '' ? 'All' : status === 'active' ? 'Active' : 'Expired'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <PageLoader />
      ) : (
        <>
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-4 text-xs text-slate-500 uppercase tracking-wider font-medium">
                    Member
                  </th>
                  <th className="text-left px-6 py-4 text-xs text-slate-500 uppercase tracking-wider font-medium">
                    Code
                  </th>
                  <th className="text-left px-6 py-4 text-xs text-slate-500 uppercase tracking-wider font-medium">
                    Joined
                  </th>
                  <th className="text-left px-6 py-4 text-xs text-slate-500 uppercase tracking-wider font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.items?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      No members found
                    </td>
                  </tr>
                ) : (
                  data?.items?.map((member: MemberSummary) => (
                    <tr
                      key={member.id}
                      onClick={() => navigate(`/members/${member.id}`)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{member.name}</p>
                        <p className="text-sm text-slate-500">{member.phone}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {member.member_code || '-'}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {format(new Date(member.joined_date), 'dd MMM yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          member.is_active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {member.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.total_pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.total)} of{' '}
                {data.total} members
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                  disabled={page === data.total_pages}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
