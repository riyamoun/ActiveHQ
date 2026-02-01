import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { reportService } from '@/services/reportService'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import {
  Users,
  UserCheck,
  IndianRupee,
  Clock,
  AlertTriangle,
  ArrowRight,
  Calendar,
} from 'lucide-react'
import { format } from 'date-fns'

export default function DashboardPage() {
  const navigate = useNavigate()

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: reportService.getDashboardStats,
  })

  const { data: expiringMembers, isLoading: expiringLoading } = useQuery({
    queryKey: ['expiring-members'],
    queryFn: () => reportService.getExpiringMembers(7),
  })

  const { data: membersWithDues } = useQuery({
    queryKey: ['members-with-dues'],
    queryFn: reportService.getMembersWithDues,
  })

  if (statsLoading) {
    return <PageLoader />
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: 'Total Members', 
            value: stats?.total_members || 0, 
            icon: Users,
            color: 'bg-slate-900',
          },
          { 
            label: 'Active Members', 
            value: stats?.active_members || 0, 
            icon: UserCheck,
            color: 'bg-emerald-600',
          },
          { 
            label: 'Today\'s Check-ins', 
            value: stats?.today_check_ins || 0, 
            icon: Calendar,
            color: 'bg-blue-600',
          },
          { 
            label: 'Today\'s Collection', 
            value: formatCurrency(stats?.today_collection || 0), 
            icon: IndianRupee,
            color: 'bg-emerald-600',
          },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-light text-slate-900">{stat.value}</div>
            <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { 
            label: 'Expiring This Week', 
            value: stats?.expiring_soon || 0, 
            icon: Clock,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
          { 
            label: 'Members with Dues', 
            value: stats?.members_with_dues || 0, 
            icon: AlertTriangle,
            color: 'text-red-600',
            bg: 'bg-red-50',
          },
          { 
            label: 'Total Dues', 
            value: formatCurrency(stats?.total_dues || 0), 
            icon: IndianRupee,
            color: 'text-red-600',
            bg: 'bg-red-50',
          },
        ].map((stat, i) => (
          <div key={i} className={`${stat.bg} rounded-xl p-6`}>
            <div className="flex items-center gap-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <span className="text-sm text-slate-600">{stat.label}</span>
            </div>
            <div className={`text-2xl font-light mt-2 ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiring Soon */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-slate-900">Expiring Soon</h3>
              <p className="text-sm text-slate-500">Memberships expiring in 7 days</p>
            </div>
            <button 
              onClick={() => navigate('/members?status=expiring')}
              className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {expiringLoading ? (
              <div className="p-6 text-center text-slate-500">Loading...</div>
            ) : expiringMembers?.length === 0 ? (
              <div className="p-6 text-center text-slate-500">No memberships expiring soon</div>
            ) : (
              expiringMembers?.slice(0, 5).map((member) => (
                <div
                  key={member.member_id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/members/${member.member_id}`)}
                >
                  <div>
                    <p className="font-medium text-slate-900">{member.member_name}</p>
                    <p className="text-sm text-slate-500">{member.member_phone}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                      member.days_until_expiry <= 2 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {member.days_until_expiry === 0
                        ? 'Expires today'
                        : `${member.days_until_expiry} days left`}
                    </span>
                    <p className="text-sm text-slate-500 mt-1">
                      {format(new Date(member.end_date), 'dd MMM yyyy')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Members with Dues */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-slate-900">Pending Dues</h3>
              <p className="text-sm text-slate-500">Members with outstanding payments</p>
            </div>
            <button 
              onClick={() => navigate('/payments')}
              className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {membersWithDues?.length === 0 ? (
              <div className="p-6 text-center text-slate-500">No pending dues</div>
            ) : (
              membersWithDues?.slice(0, 5).map((member) => (
                <div
                  key={member.member_id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/members/${member.member_id}`)}
                >
                  <div>
                    <p className="font-medium text-slate-900">{member.member_name}</p>
                    <p className="text-sm text-slate-500">{member.member_phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-red-600">
                      {formatCurrency(member.total_due)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
