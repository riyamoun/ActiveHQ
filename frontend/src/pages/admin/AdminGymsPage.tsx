import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Users,
  TrendingUp,
  Activity,
  Search,
  MoreVertical,
} from 'lucide-react'
import { api } from '@/lib/api'

interface Gym {
  id: string
  name: string
  city: string
  members_count: number
  revenue_this_month: number
  is_active: boolean
  created_at: string
}

interface PlatformStats {
  gyms: { total: number; active: number; inactive: number }
  members: { total: number; active: number; inactive: number }
  users: { total: number; owners: number; managers: number; staff: number }
  revenue: { this_month: number }
}

export function AdminGymsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)

  // Fetch stats
  const statsQuery = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const response = await api.get<PlatformStats>('/admin/stats')
      return response.data
    },
  })

  // Fetch gyms list
  const gymsQuery = useQuery({
    queryKey: ['admin', 'gyms', page],
    queryFn: async () => {
      const response = await api.get<{ items: Gym[]; total: number }>('/admin/gyms', { params: { page, page_size: 20 } })
      return response.data
    },
  })

  const stats = statsQuery.data as PlatformStats | undefined
  const gymsData = gymsQuery.data as { items: Gym[]; total: number } | undefined

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage all gyms and monitor platform metrics</p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="w-5 h-5" />}
            title="Total Gyms"
            value={stats.gyms.total}
            subtitle={`${stats.gyms.active} active`}
            color="blue"
          />
          <StatCard
            icon={<Activity className="w-5 h-5" />}
            title="Total Members"
            value={stats.members.total}
            subtitle={`${stats.members.active} active`}
            color="green"
          />
          <StatCard
            icon={<Users className="w-5 h-5" />}
            title="Platform Users"
            value={stats.users.total}
            subtitle={`${stats.users.owners} owners`}
            color="purple"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            title="This Month Revenue"
            value={`₹${(stats.revenue.this_month / 100000).toFixed(1)}L`}
            subtitle="All gyms"
            color="amber"
          />
        </div>
      )}

      {/* Gyms Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">All Gyms</h2>
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search gyms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {gymsQuery.isPending ? (
          <div className="p-6 text-center text-gray-500">Loading gyms...</div>
        ) : gymsData?.items.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No gyms found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Gym Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Members
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Revenue (Month)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {gymsData?.items.map((gym) => (
                  <tr key={gym.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{gym.name}</div>
                      <div className="text-sm text-gray-500">ID: {gym.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{gym.city}</td>
                    <td className="px-6 py-4 text-gray-700">{gym.members_count}</td>
                    <td className="px-6 py-4 text-gray-700">
                      ₹{(gym.revenue_this_month / 100000).toFixed(1)}L
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          gym.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {gym.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {gymsData && gymsData.total > 20 && (
          <div className="p-4 border-t flex justify-between items-center">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {Math.ceil(gymsData.total / 20)}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page * 20 >= gymsData.total}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  title: string
  value: string | number
  subtitle: string
  color: 'blue' | 'green' | 'purple' | 'amber'
}

function StatCard({ icon, title, value, subtitle, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className={`${colorClasses[color]} p-3 rounded-lg`}>{icon}</div>
      </div>
    </div>
  )
}
