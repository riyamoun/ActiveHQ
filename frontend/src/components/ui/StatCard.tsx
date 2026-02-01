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
  default: 'bg-gray-100 text-gray-600',
  primary: 'bg-primary-100 text-primary-600',
  success: 'bg-green-100 text-green-600',
  warning: 'bg-yellow-100 text-yellow-600',
  danger: 'bg-red-100 text-red-600',
}

export default function StatCard({
  title,
  value,
  icon,
  change,
  variant = 'default',
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p
              className={clsx(
                'text-sm mt-2',
                change.value >= 0 ? 'text-green-600' : 'text-red-600'
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
