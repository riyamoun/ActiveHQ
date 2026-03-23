import React from 'react'
import clsx from 'clsx'

/**
 * Skeleton Loader Component
 * Displays placeholder skeleton while content is loading.
 * Useful for lists, cards, charts, and other content.
 */

interface SkeletonProps {
  /**
   * Type of skeleton to display
   */
  type?: 'line' | 'circle' | 'card' | 'table-row' | 'chart'
  /**
   * Number of skeleton items to display (for list skeletons)
   */
  count?: number
  /**
   * Additional CSS classes
   */
  className?: string
  /**
   * Width of the skeleton
   */
  width?: string
  /**
   * Height of the skeleton
   */
  height?: string
}

/**
 * Basic line skeleton loader
 */
export const SkeletonLine: React.FC<{ width?: string; height?: string; className?: string }> = ({
  width = 'w-full',
  height = 'h-4',
  className,
}) => (
  <div className={clsx('bg-gray-200 rounded animate-pulse', width, height, className)} />
)

/**
 * Circle skeleton loader (for avatars)
 */
export const SkeletonCircle: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className,
}) => {
  const sizeClass = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }[size]

  return <div className={clsx('bg-gray-200 rounded-full animate-pulse', sizeClass, className)} />
}

/**
 * Card skeleton loader
 */
export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={clsx('bg-white rounded-lg border border-gray-200 p-4', className)}>
    <SkeletonLine className="mb-4" width="w-1/2" height="h-6" />
    <SkeletonLine className="mb-2" />
    <SkeletonLine className="mb-4" width="w-3/4" />
    <SkeletonLine className="mb-2" height="h-3" />
    <SkeletonLine width="w-1/2" height="h-3" />
  </div>
)

/**
 * Table row skeleton loader
 */
export const SkeletonTableRow: React.FC<{ columns?: number; className?: string }> = ({
  columns = 5,
  className,
}) => (
  <tr className={className}>
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-6 py-4">
        <SkeletonLine height="h-4" />
      </td>
    ))}
  </tr>
)

/**
 * Chart skeleton loader
 */
export const SkeletonChart: React.FC<{ className?: string }> = ({ className }) => (
  <div className={clsx('bg-white rounded-lg border border-gray-200 p-6', className)}>
    <SkeletonLine className="mb-6" width="w-1/3" height="h-6" />
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-end gap-2 h-48">
          {Array.from({ length: 7 }).map((_, j) => (
            <div
              key={j}
              className="flex-1 bg-gray-200 rounded-t animate-pulse"
              style={{ height: `${Math.random() * 100 + 20}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  </div>
)

/**
 * Generic Skeleton Component
 */
const Skeleton: React.FC<SkeletonProps> = ({
  type = 'line',
  count = 1,
  className,
  width,
  height,
}) => {
  const skeletons = {
    line: <SkeletonLine width={width} height={height} />,
    circle: <SkeletonCircle />,
    card: <SkeletonCard />,
    'table-row': <SkeletonTableRow />,
    chart: <SkeletonChart />,
  }

  const content = skeletons[type]

  if (count === 1) {
    return <div className={className}>{content}</div>
  }

  return (
    <div className={clsx('space-y-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{content}</div>
      ))}
    </div>
  )
}

export default Skeleton
