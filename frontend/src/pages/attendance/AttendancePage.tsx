import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { attendanceService } from '@/services/attendanceService'
import { memberService } from '@/services/memberService'
import { getErrorMessage } from '@/lib/api'
import Card, { CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import StatCard from '@/components/ui/StatCard'
import Modal from '@/components/ui/Modal'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { UserCheck, Users, Clock, Search, LogOut } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function AttendancePage() {
  const queryClient = useQueryClient()
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const { data: todaySummary } = useQuery({
    queryKey: ['attendance-today'],
    queryFn: attendanceService.getTodaySummary,
  })

  const { data: currentlyIn } = useQuery({
    queryKey: ['currently-in'],
    queryFn: attendanceService.getCurrentlyCheckedIn,
  })

  const { data: attendance, isLoading } = useQuery({
    queryKey: ['attendance', selectedDate],
    queryFn: () =>
      attendanceService.getAttendance({
        target_date: selectedDate,
        page_size: 100,
      }),
  })

  const checkOutMutation = useMutation({
    mutationFn: attendanceService.checkOut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      queryClient.invalidateQueries({ queryKey: ['currently-in'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] })
      toast.success('Member checked out')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-500">Track member check-ins and check-outs</p>
        </div>
        <Button
          variant="primary"
          leftIcon={<UserCheck className="w-4 h-4" />}
          onClick={() => setShowCheckInModal(true)}
        >
          Check In Member
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Today's Check-ins"
          value={todaySummary?.total_check_ins || 0}
          icon={<UserCheck className="w-6 h-6" />}
          variant="primary"
        />
        <StatCard
          title="Unique Members"
          value={todaySummary?.unique_members || 0}
          icon={<Users className="w-6 h-6" />}
          variant="success"
        />
        <StatCard
          title="Currently In Gym"
          value={currentlyIn?.length || 0}
          icon={<Clock className="w-6 h-6" />}
          variant="warning"
        />
      </div>

      {/* Currently In Gym */}
      {currentlyIn && currentlyIn.length > 0 && (
        <Card>
          <CardHeader
            title="Currently in Gym"
            subtitle="Members who haven't checked out yet"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentlyIn.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100"
              >
                <div>
                  <p className="font-medium text-gray-900">{record.member_name}</p>
                  <p className="text-sm text-gray-500">
                    In since {format(new Date(record.check_in_time), 'hh:mm a')}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<LogOut className="w-4 h-4" />}
                  onClick={() => checkOutMutation.mutate(record.member_id)}
                  isLoading={checkOutMutation.isPending}
                >
                  Check Out
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Date Filter */}
      <div className="flex items-center gap-4">
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-auto"
        />
        <span className="text-gray-500">
          {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
        </span>
      </div>

      {/* Attendance Table */}
      {isLoading ? (
        <PageLoader />
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Check In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Check Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {attendance?.items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No check-ins for this date
                    </td>
                  </tr>
                ) : (
                  attendance?.items.map((record) => {
                    const checkIn = new Date(record.check_in_time)
                    const checkOut = record.check_out_time
                      ? new Date(record.check_out_time)
                      : null
                    const duration = checkOut
                      ? Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60))
                      : null

                    return (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{record.member_name}</p>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {format(checkIn, 'hh:mm a')}
                        </td>
                        <td className="px-6 py-4">
                          {checkOut ? (
                            <span className="text-gray-600">{format(checkOut, 'hh:mm a')}</span>
                          ) : (
                            <Badge variant="success">Still In</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {duration ? `${duration} mins` : '-'}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Check In Modal */}
      <CheckInModal
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
      />
    </div>
  )
}

function CheckInModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')

  const { data: members } = useQuery({
    queryKey: ['members-search', search],
    queryFn: () => memberService.getMembers({ query: search, page_size: 10 }),
    enabled: search.length >= 2,
  })

  const checkInMutation = useMutation({
    mutationFn: attendanceService.checkIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      queryClient.invalidateQueries({ queryKey: ['currently-in'] })
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] })
      toast.success('Member checked in')
      onClose()
      setSearch('')
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Check In Member">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
            autoFocus
          />
        </div>

        <div className="max-h-64 overflow-y-auto">
          {search.length < 2 ? (
            <p className="text-center text-gray-500 py-4">
              Type at least 2 characters to search
            </p>
          ) : members?.items.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No members found</p>
          ) : (
            <div className="space-y-2">
              {members?.items.map((member) => (
                <button
                  key={member.id}
                  onClick={() => checkInMutation.mutate(member.id)}
                  disabled={checkInMutation.isPending}
                  className="w-full p-4 text-left rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.phone}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
