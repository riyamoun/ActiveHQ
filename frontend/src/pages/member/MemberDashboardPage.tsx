import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  CalendarCheck2,
  Sparkles,
  Wallet,
  AlertCircle,
  MessageCircle,
  RefreshCw,
} from 'lucide-react'
import {
  fetchMyAttendance,
  fetchMyPayments,
  fetchMyPlan,
  type ActivePlan,
  type AttendanceEntry,
  type PaymentEntry,
} from '@/lib/memberApi'
import { useMemberAuthStore } from '@/store/memberAuthStore'

const WHATSAPP_LINK =
  'https://wa.me/919354349118?text=Hi%20ActiveHQ%2C%20I%20need%20help%20with%20my%20account.'

export function MemberDashboardPage() {
  const member = useMemberAuthStore((s) => s.member)

  const planQuery = useQuery({ queryKey: ['m', 'plan'], queryFn: fetchMyPlan })
  const attendanceQuery = useQuery({
    queryKey: ['m', 'attendance', 7],
    queryFn: () => fetchMyAttendance(7, 10),
  })
  const paymentsQuery = useQuery({
    queryKey: ['m', 'payments', 3],
    queryFn: () => fetchMyPayments(3),
  })

  return (
    <div className="space-y-6 pb-4">
      {/* ──────────────────── Plan / dues card ──────────────────── */}
      <PlanCard
        plan={planQuery.data}
        isLoading={planQuery.isLoading}
        isError={planQuery.isError}
        onRetry={planQuery.refetch}
      />

      {/* ─────────────────── Quick stats grid ───────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <StatTile
          Icon={CalendarCheck2}
          label="Last 7 days"
          value={attendanceCount(attendanceQuery.data)}
          unit="visits"
          loading={attendanceQuery.isLoading}
        />
        <StatTile
          Icon={Wallet}
          label="Recent payments"
          value={paymentsQuery.data?.length ?? 0}
          unit={(paymentsQuery.data?.length ?? 0) === 1 ? 'entry' : 'entries'}
          loading={paymentsQuery.isLoading}
        />
      </div>

      {/* ────────────────── Recent activity feed ────────────────── */}
      <Section
        title="Recent visits"
        action={
          <Link
            to="/m/attendance"
            className="text-xs text-lime-400 hover:text-lime-300 flex items-center gap-1"
          >
            See all <ArrowRight className="w-3 h-3" />
          </Link>
        }
      >
        {attendanceQuery.isLoading ? (
          <SkeletonRows count={3} />
        ) : attendanceQuery.isError ? (
          <InlineError onRetry={attendanceQuery.refetch} />
        ) : !attendanceQuery.data || attendanceQuery.data.length === 0 ? (
          <EmptyHint Icon={Activity}>No check-ins yet. Your visits will show up here.</EmptyHint>
        ) : (
          <ul className="space-y-2">
            {attendanceQuery.data.slice(0, 5).map((row) => (
              <AttendanceRow key={row.id} row={row} />
            ))}
          </ul>
        )}
      </Section>

      {/* ────────────────── Recent payments feed ────────────────── */}
      <Section
        title="Recent payments"
        action={
          <Link
            to="/m/payments"
            className="text-xs text-lime-400 hover:text-lime-300 flex items-center gap-1"
          >
            See all <ArrowRight className="w-3 h-3" />
          </Link>
        }
      >
        {paymentsQuery.isLoading ? (
          <SkeletonRows count={2} />
        ) : paymentsQuery.isError ? (
          <InlineError onRetry={paymentsQuery.refetch} />
        ) : !paymentsQuery.data || paymentsQuery.data.length === 0 ? (
          <EmptyHint Icon={Wallet}>No payments recorded yet.</EmptyHint>
        ) : (
          <ul className="space-y-2">
            {paymentsQuery.data.map((p) => (
              <PaymentRow key={p.id} p={p} />
            ))}
          </ul>
        )}
      </Section>

      {/* ────────────────────── Help block ──────────────────────── */}
      <a
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 p-4 hover:bg-[#25D366]/15 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#25D366] flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-white">Need help?</div>
            <div className="text-xs text-white/60">WhatsApp ActiveHQ support</div>
          </div>
          <ArrowRight className="w-4 h-4 text-white/40" />
        </div>
      </a>

      <p className="text-center text-[11px] text-white/30">
        Logged in as <span className="text-white/50">{member?.name}</span>
      </p>
    </div>
  )
}

/* ──────────────────────── Plan card ─────────────────────────── */

function PlanCard({
  plan,
  isLoading,
  isError,
  onRetry,
}: {
  plan?: ActivePlan
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}) {
  if (isLoading) {
    return (
      <div className="rounded-3xl bg-white/[0.03] border border-white/10 p-6 h-44 animate-pulse" />
    )
  }
  if (isError) {
    return (
      <div className="rounded-3xl bg-rose-500/10 border border-rose-500/30 p-5 flex items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-300 mt-0.5" />
          <div>
            <div className="text-sm text-white font-semibold">Couldn't load your plan</div>
            <div className="text-xs text-white/60 mt-0.5">Check your connection and retry.</div>
          </div>
        </div>
        <button
          onClick={onRetry}
          className="p-2 rounded-full bg-white/10 hover:bg-white/15"
        >
          <RefreshCw className="w-4 h-4 text-white" />
        </button>
      </div>
    )
  }

  const hasPlan = !!plan && !!plan.membership_id
  if (!hasPlan) {
    return (
      <div className="relative overflow-hidden rounded-3xl bg-white/[0.03] border border-white/10 p-6">
        <Sparkles className="w-5 h-5 text-lime-400 mb-3" />
        <div className="text-lg font-bold mb-1">No active plan yet</div>
        <p className="text-sm text-white/60 leading-relaxed">
          Once your gym adds your membership, it'll show up here with your renewal date and dues.
        </p>
      </div>
    )
  }

  const status = plan!.status
  const daysLeft = plan!.days_remaining
  const isExpiring = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0
  const isExpired = daysLeft !== null && daysLeft < 0
  const due = plan!.amount_due ?? 0
  const hasDue = due > 0

  const headlineColor = isExpired
    ? 'text-rose-300'
    : isExpiring
      ? 'text-amber-300'
      : 'text-lime-400'

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-lime-400/10 via-white/[0.03] to-transparent border border-lime-400/30 p-6">
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-lime-400/20 blur-3xl rounded-full pointer-events-none" />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] tracking-[0.25em] uppercase text-white/50">
            Your plan
          </span>
          <StatusPill status={status} />
        </div>
        <div className="text-2xl font-bold leading-tight">{plan!.plan_name || 'Membership'}</div>
        {daysLeft !== null && (
          <div className={`mt-3 text-3xl font-bold ${headlineColor}`}>
            {isExpired ? `${Math.abs(daysLeft)} days ago` : `${daysLeft} days left`}
          </div>
        )}
        {plan!.end_date && (
          <div className="mt-1 text-xs text-white/50">
            Valid till {formatDate(plan!.end_date)}
          </div>
        )}

        {/* Dues */}
        {hasDue && (
          <div className="mt-5 flex items-center justify-between rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3">
            <div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-amber-200/80">Pending dues</div>
              <div className="text-lg font-bold text-amber-200">{formatCurrency(due)}</div>
            </div>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-full bg-amber-300 text-black text-xs font-bold hover:bg-amber-200 transition-colors flex items-center gap-1"
            >
              <MessageCircle className="w-3.5 h-3.5" /> Pay
            </a>
          </div>
        )}

        {!hasDue && !isExpired && (
          <div className="mt-5 text-xs text-white/40">All dues cleared. You're good to go.</div>
        )}
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: ActivePlan['status'] }) {
  if (!status) return null
  const map: Record<NonNullable<ActivePlan['status']>, { label: string; cls: string }> = {
    active: { label: 'Active', cls: 'bg-lime-400/15 text-lime-400 border-lime-400/30' },
    expired: { label: 'Expired', cls: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
    paused: { label: 'Paused', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
    cancelled: { label: 'Cancelled', cls: 'bg-white/10 text-white/60 border-white/15' },
  }
  const { label, cls } = map[status]
  return (
    <span className={`text-[10px] tracking-[0.2em] uppercase px-2 py-1 rounded-full border ${cls}`}>
      {label}
    </span>
  )
}

/* ─────────────────────── Small tiles + rows ─────────────────────────── */

function StatTile({
  Icon,
  label,
  value,
  unit,
  loading,
}: {
  Icon: typeof CalendarCheck2
  label: string
  value: number
  unit: string
  loading: boolean
}) {
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-4 h-4 text-lime-400" />
      </div>
      <div className="text-[10px] tracking-[0.25em] uppercase text-white/40">{label}</div>
      <div className="mt-1 text-2xl font-bold">
        {loading ? <span className="text-white/30">…</span> : value}
        <span className="ml-1 text-xs text-white/40 font-normal">{unit}</span>
      </div>
    </div>
  )
}

function Section({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function AttendanceRow({ row }: { row: AttendanceEntry }) {
  return (
    <li className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-lime-400/10 border border-lime-400/20 flex items-center justify-center">
          <CalendarCheck2 className="w-4 h-4 text-lime-400" />
        </div>
        <div>
          <div className="text-sm font-semibold">{formatDateLong(row.check_in_time)}</div>
          <div className="text-xs text-white/50">
            {formatTime(row.check_in_time)}
            {row.duration_minutes ? ` · ${row.duration_minutes} min` : ''}
          </div>
        </div>
      </div>
    </li>
  )
}

function PaymentRow({ p }: { p: PaymentEntry }) {
  return (
    <li className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
          <Wallet className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <div className="text-sm font-semibold">{formatCurrency(p.amount)}</div>
          <div className="text-xs text-white/50 uppercase tracking-wide">
            {p.payment_mode} · {formatDate(p.payment_date)}
          </div>
        </div>
      </div>
    </li>
  )
}

function SkeletonRows({ count }: { count: number }) {
  return (
    <ul className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="h-12 rounded-xl bg-white/[0.03] border border-white/5 animate-pulse" />
      ))}
    </ul>
  )
}

function EmptyHint({ Icon, children }: { Icon: typeof Activity; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-white/15 text-white/50 text-sm">
      <Icon className="w-4 h-4" />
      {children}
    </div>
  )
}

function InlineError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-sm">
      <div className="flex items-center gap-2 text-rose-200">
        <AlertCircle className="w-4 h-4" />
        Couldn't load.
      </div>
      <button onClick={onRetry} className="text-xs text-rose-100 underline">
        Retry
      </button>
    </div>
  )
}

/* ────────────────────────── Formatters ──────────────────────────────── */

function attendanceCount(rows?: AttendanceEntry[]) {
  return rows ? rows.length : 0
}

function formatCurrency(n: number | string | null | undefined) {
  if (n === null || n === undefined) return '₹0'
  const v = typeof n === 'string' ? Number(n) : n
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(v) ? v : 0)
}

function formatDate(d: string | Date) {
  const dt = typeof d === 'string' ? new Date(d) : d
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateLong(d: string | Date) {
  const dt = typeof d === 'string' ? new Date(d) : d
  return dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatTime(d: string | Date) {
  const dt = typeof d === 'string' ? new Date(d) : d
  return dt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}
