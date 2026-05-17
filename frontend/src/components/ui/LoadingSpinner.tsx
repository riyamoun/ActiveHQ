import { Loader2 } from 'lucide-react'
import clsx from 'clsx'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
}

const logoHeights = {
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-14',
}

export default function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <Loader2 className={clsx('animate-spin text-emerald-400', sizes[size], className)} />
  )
}

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <img
        src="/logo.jpg"
        alt=""
        className={clsx(logoHeights.lg, 'w-auto object-contain animate-logo-breathe opacity-90')}
      />
      <LoadingSpinner size="md" />
    </div>
  )
}
