import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarCheck2, AlertCircle, RefreshCw } from 'lucide-react'
import { fetchMyAttendance, type AttendanceEntry } from '@/lib/memberApi'

const RANGES: { value: number; label: string }[] = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
]

export function MemberAttendancePage() {
  const [days, setDays] = useState(30)

  const query = useQuery({
    queryKey: ['m', 'attendance', days],
    queryFn: () => fetchMyAttendance(days, 100),
  })

  const stats = useMemo(() => {
    const rows = query.data || []
    const total = rows.length
    const perWeek = total > 0 && days > 0 ? +(total / (days / 7)).toFixed(1) : 0
    const lastVisit = rows[0]?.check_in_time
    return { total, perWeek, lastVisit }
  }, [query.data, days])

  return (
    <div className="space-y-6 pb-4">
      <div>
        <h1 className="text-2xl font-bold">Attendance</h1>
        <p className="text-sm text-white/50 mt-1">Your gym visits, oldest at the bottom.</p>
      </div>

      {/* Range tabs */}
      <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-white/[0.04] border border-white/10">
        {RANGES.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => setDays(r.value)}
            className={`py-2 rounded-xl text-xs font-semibold transition-all ${
              days === r.value
                ? 'bg-lime-400 text-black'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Last {r.label}
          </button>
        ))}
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 gap-3">
        <Tile label="Total visits" value={stats.total.toString()} />
        <Tile label="Per week" value={stats.perWeek.toString()} />
      </div>
      {stats.lastVisit && (
        <p className="text-xs text-white/50 -mt-2">
          Last visit: <span className="text-white/80">{formatLong(stats.lastVisit)}</span>
        </p>
      )}

      {/* Body */}
      <div>
        {query.isLoading ? (
          <ul className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <li
                key={i}
                className="h-14 rounded-xl bg-white/[0.03] border border-white/5 animate-pulse"
              />
            ))}
          </ul>
        ) : query.isError ? (
          <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30">
            <div className="flex items-center gap-2 text-rose-200 text-sm">
              <AlertCircle className="w-4 h-4" />
              Couldn't load attendance.
            </div>
            <button
              onClick={() => query.refetch()}
              className="p-2 rounded-full bg-white/10 hover:bg-white/15"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        ) : !query.data || query.data.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center">
            <CalendarCheck2 className="w-8 h-8 text-white/30 mx-auto mb-3" />
            <p className="text-white/60 text-sm">
              No check-ins in this range. Drop by the gym — we'll log it!
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {query.data.map((row) => (
              <Row key={row.id} row={row} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
      <div className="text-[10px] tracking-[0.25em] uppercase text-white/40">{label}</div>
      <div className="mt-1 text-3xl font-bold text-lime-400">{value}</div>
    </div>
  )
}

function Row({ row }: { row: AttendanceEntry }) {
  const dt = new Date(row.check_in_time)
  return (
    <li className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5">
      <div className="w-12 text-center flex-shrink-0">
        <div className="text-[10px] tracking-[0.2em] uppercase text-white/40">
          {dt.toLocaleDateString('en-IN', { month: 'short' })}
        </div>
        <div className="text-xl font-bold text-white">
          {dt.toLocaleDateString('en-IN', { day: '2-digit' })}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white">
          {dt.toLocaleDateString('en-IN', { weekday: 'long' })}
        </div>
        <div className="text-xs text-white/50">
          Checked in at {dt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
          {row.duration_minutes ? ` · stayed ${row.duration_minutes} min` : ''}
        </div>
      </div>
      <div className="w-2 h-2 rounded-full bg-lime-400 flex-shrink-0" />
    </li>
  )
}

function formatLong(d: string | Date) {
  const dt = typeof d === 'string' ? new Date(d) : d
  return dt.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })
}
