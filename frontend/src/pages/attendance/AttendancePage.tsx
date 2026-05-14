import { Fragment, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { attendanceService } from '@/services/attendanceService'
import { memberService } from '@/services/memberService'
import { getErrorMessage } from '@/lib/api'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import {
  UserCheck,
  Users,
  Clock,
  Search,
  LogOut,
  Calendar,
  X,
} from 'lucide-react'
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

  const { data: attendance, isLoading, isError } = useQuery({
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
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10">
            <Calendar className="h-5 w-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Attendance</h1>
            <p className="text-slate-400">Track member check-ins and check-outs</p>
          </div>
        </div>
        <Button
          variant="primary"
          leftIcon={<UserCheck className="w-4 h-4" />}
          onClick={() => setShowCheckInModal(true)}
          className="!bg-emerald-600 !text-white hover:!bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20 focus:ring-emerald-500"
        >
          Check In Member
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Today&apos;s Check-ins</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {todaySummary?.total_check_ins || 0}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
              <UserCheck className="h-6 w-6" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Unique Members</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {todaySummary?.unique_members || 0}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Currently In Gym</p>
              <p className="mt-1 text-2xl font-bold text-white">{currentlyIn?.length || 0}</p>
            </div>
            <div className="rounded-xl bg-amber-500/10 p-3 text-amber-400">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Currently In Gym */}
      {currentlyIn && currentlyIn.length > 0 && (
        <Card className="rounded-2xl !border-slate-800/60 !bg-slate-900/60 shadow-none">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white">Currently in Gym</h3>
            <p className="mt-0.5 text-sm text-slate-400">
              Members who haven&apos;t checked out yet
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {currentlyIn.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4"
              >
                <div>
                  <p className="font-medium text-white">{record.member_name}</p>
                  <p className="text-sm text-slate-400">
                    In since {format(new Date(record.check_in_time), 'hh:mm a')}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<LogOut className="w-4 h-4" />}
                  onClick={() => checkOutMutation.mutate(record.member_id)}
                  isLoading={checkOutMutation.isPending}
                  className="!border-slate-800/60 !bg-slate-800/60 !text-white hover:!bg-slate-800/30"
                >
                  Check Out
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Date Filter */}
      <div className="flex flex-wrap items-center gap-4">
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-auto !border-slate-800/60 !bg-slate-900/60 text-white placeholder-slate-500"
        />
        <span className="text-slate-400">
          {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
        </span>
      </div>

      {/* Attendance Table */}
      {isLoading ? (
        <PageLoader />
      ) : (
        <Card
          padding="none"
          className="overflow-hidden rounded-2xl !border-slate-800/60 !bg-slate-900/60 shadow-none"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800/60 bg-slate-800/60">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">
                    Check In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">
                    Check Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-400">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {isError ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-rose-400">
                      Could not load attendance. Please retry.
                    </td>
                  </tr>
                ) : !attendance?.items?.length ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                      No check-ins for this date
                    </td>
                  </tr>
                ) : (
                  attendance.items.map((record) => {
                    const checkIn = new Date(record.check_in_time)
                    const checkOut = record.check_out_time
                      ? new Date(record.check_out_time)
                      : null
                    const duration = checkOut
                      ? Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60))
                      : null

                    return (
                      <tr key={record.id} className="hover:bg-slate-800/30">
                        <td className="px-6 py-4">
                          <p className="font-medium text-white">{record.member_name}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-400">{format(checkIn, 'hh:mm a')}</td>
                        <td className="px-6 py-4">
                          {checkOut ? (
                            <span className="text-slate-400">{format(checkOut, 'hh:mm a')}</span>
                          ) : (
                            <Badge
                              variant="success"
                              className="border border-emerald-500/20 bg-emerald-500/10 !text-emerald-400"
                            >
                              Still In
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-400">
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

      <CheckInModal isOpen={showCheckInModal} onClose={() => setShowCheckInModal(false)} />
    </div>
  )
}

function CheckInModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')

  const { data: members, isFetching: membersFetching } = useQuery({
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

  if (!isOpen) return null

  return (
    <Fragment>
      <div
        className="fixed inset-0 z-50 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="relative w-full max-w-lg rounded-2xl border border-slate-800/60 bg-slate-900/60 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800/60 px-6 py-4">
              <h2 className="text-lg font-semibold text-white">Check In Member</h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1 transition-colors hover:bg-slate-800/30"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input w-full rounded-xl border-slate-800/60 bg-slate-900/60 pl-10 text-white placeholder-slate-500"
                  autoFocus
                />
              </div>

              <div className="max-h-64 overflow-y-auto">
                {search.length < 2 ? (
                  <p className="py-4 text-center text-slate-400">
                    Type at least 2 characters to search
                  </p>
                ) : membersFetching ? (
                  <p className="py-4 text-center text-slate-400">Searching…</p>
                ) : !members?.items?.length ? (
                  <p className="py-4 text-center text-slate-400">No members found</p>
                ) : (
                  <div className="space-y-2">
                    {members.items.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => checkInMutation.mutate(member.id)}
                        disabled={checkInMutation.isPending}
                        className="w-full rounded-xl border border-slate-800/60 bg-slate-900/60 p-4 text-left transition-colors hover:bg-slate-800/30"
                      >
                        <p className="font-medium text-white">{member.name}</p>
                        <p className="text-sm text-slate-400">{member.phone}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  )
}
