import clsx from 'clsx'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  change?: {
    value: number
    label: string
  }
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
}

const iconVariants = {
  default: 'bg-slate-800/60 text-slate-400',
  primary: 'bg-emerald-500/10 text-emerald-400',
  success: 'bg-emerald-500/10 text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-400',
  danger: 'bg-red-500/10 text-red-400',
}

export default function StatCard({
  title,
  value,
  icon,
  change,
  variant = 'default',
}: StatCardProps) {
  return (
    <div className="bg-slate-900/60 rounded-2xl border border-slate-800/60 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {change && (
            <p
              className={clsx(
                'text-sm mt-2',
                change.value >= 0 ? 'text-emerald-400' : 'text-red-400'
              )}
            >
              {change.value >= 0 ? '+' : ''}
              {change.value}% {change.label}
            </p>
          )}
        </div>
        <div className={clsx('p-3 rounded-xl', iconVariants[variant])}>{icon}</div>
      </div>
    </div>
  )
}
