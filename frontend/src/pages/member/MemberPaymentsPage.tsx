import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Wallet,
  AlertCircle,
  RefreshCw,
  Banknote,
  Smartphone,
  CreditCard,
  Building2,
} from 'lucide-react'
import { fetchMyPayments, type PaymentEntry, type PaymentMode } from '@/lib/memberApi'

const MODE_META: Record<PaymentMode, { Icon: typeof Wallet; label: string; cls: string }> = {
  cash: { Icon: Banknote, label: 'Cash', cls: 'text-lime-400 bg-lime-400/10 border-lime-400/20' },
  upi: { Icon: Smartphone, label: 'UPI', cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  card: { Icon: CreditCard, label: 'Card', cls: 'text-sky-400 bg-sky-400/10 border-sky-400/20' },
  bank_transfer: { Icon: Building2, label: 'Bank', cls: 'text-violet-400 bg-violet-400/10 border-violet-400/20' },
  other: { Icon: Wallet, label: 'Other', cls: 'text-white/60 bg-white/5 border-white/10' },
}

export function MemberPaymentsPage() {
  const query = useQuery({
    queryKey: ['m', 'payments', 50],
    queryFn: () => fetchMyPayments(50),
  })

  const total = useMemo(
    () =>
      (query.data || []).reduce((sum, p) => sum + Number(p.amount || 0), 0),
    [query.data],
  )

  return (
    <div className="space-y-6 pb-4">
      <div>
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-sm text-white/50 mt-1">Receipts of every payment recorded on your account.</p>
      </div>

      {/* Header tile */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5">
        <div className="text-[10px] tracking-[0.25em] uppercase text-white/40">Lifetime paid</div>
        <div className="mt-1 text-4xl font-bold text-lime-400">{formatCurrency(total)}</div>
        <div className="mt-1 text-xs text-white/50">
          Across {query.data?.length ?? 0} recorded payment{query.data?.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* List */}
      {query.isLoading ? (
        <ul className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <li
              key={i}
              className="h-16 rounded-xl bg-white/[0.03] border border-white/5 animate-pulse"
            />
          ))}
        </ul>
      ) : query.isError ? (
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30">
          <div className="flex items-center gap-2 text-rose-200 text-sm">
            <AlertCircle className="w-4 h-4" />
            Couldn't load payments.
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
          <Wallet className="w-8 h-8 text-white/30 mx-auto mb-3" />
          <p className="text-white/60 text-sm">No payments recorded yet.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {query.data.map((p) => (
            <Row key={p.id} p={p} />
          ))}
        </ul>
      )}

      <p className="text-[11px] text-white/30 text-center">
        Need a printed receipt? Ask at the gym counter.
      </p>
    </div>
  )
}

function Row({ p }: { p: PaymentEntry }) {
  const meta = MODE_META[p.payment_mode] || MODE_META.other
  const { Icon } = meta
  return (
    <li className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/5">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center border ${meta.cls}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">{formatCurrency(Number(p.amount))}</span>
          <span className="text-[10px] tracking-[0.2em] uppercase text-white/40">{meta.label}</span>
        </div>
        <div className="text-xs text-white/50 mt-0.5">
          {formatDate(p.payment_date)}
          {p.reference_number ? ` · ref ${p.reference_number}` : ''}
        </div>
        {p.notes && (
          <div className="text-xs text-white/40 mt-1 truncate">{p.notes}</div>
        )}
      </div>
    </li>
  )
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0)
}

function formatDate(d: string | Date) {
  const dt = typeof d === 'string' ? new Date(d) : d
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
