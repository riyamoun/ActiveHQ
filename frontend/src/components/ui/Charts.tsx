import React from 'react'
import clsx from 'clsx'

/**
 * Simple Chart Components for ActiveHQ
 * Uses lightweight SVG-based visualization with no heavy dependencies
 */

interface ChartDataPoint {
  label: string
  value: number
  percentage?: number
}

interface BarChartProps {
  /**
   * Chart title
   */
  title?: string
  /**
   * Data points for the chart
   */
  data: ChartDataPoint[]
  /**
   * Chart height in pixels
   */
  height?: number
  /**
   * Show value labels on bars
   */
  showValues?: boolean
  /**
   * Color of the bars (hex or tailwind color name)
   */
  color?: string
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * Simple Bar Chart Component
 * Displays data as horizontal or vertical bars
 */
export const BarChart: React.FC<BarChartProps> = ({
  title,
  data,
  height = 300,
  showValues = true,
  color = '#3b82f6',
  className,
}) => {
  if (!data || data.length === 0) {
    return <div className="text-gray-500">No data available</div>
  }

  const maxValue = Math.max(...data.map((d) => d.value))
  const chartWidth = 600
  const barHeight = height / data.length

  return (
    <div className={clsx('bg-white rounded-lg p-6', className)}>
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${chartWidth} ${height}`}
        className="overflow-x-auto"
      >
        {data.map((point, i) => {
          const yPos = i * barHeight
          const barWidth = (point.value / maxValue) * (chartWidth * 0.8)
          
          return (
            <g key={i}>
              {/* Label */}
              <text
                x="10"
                y={yPos + barHeight / 2 + 5}
                fontSize="12"
                fill="#374151"
                textAnchor="start"
              >
                {point.label}
              </text>
              
              {/* Bar */}
              <rect
                x="120"
                y={yPos + barHeight * 0.2}
                width={barWidth}
                height={barHeight * 0.6}
                fill={color}
                opacity="0.8"
                rx="4"
              />
              
              {/* Value label */}
              {showValues && (
                <text
                  x={130 + barWidth}
                  y={yPos + barHeight / 2 + 5}
                  fontSize="12"
                  fill="#6b7280"
                  textAnchor="start"
                >
                  {point.value.toLocaleString()}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

interface PieChartProps {
  /**
   * Chart title
   */
  title?: string
  /**
   * Data points for the chart
   */
  data: ChartDataPoint[]
  /**
   * Chart size in pixels
   */
  size?: number
  /**
   * Show legend
   */
  showLegend?: boolean
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * Simple Pie/Donut Chart Component
 */
export const PieChart: React.FC<PieChartProps> = ({
  title,
  data,
  size = 300,
  showLegend = true,
  className,
}) => {
  if (!data || data.length === 0) {
    return <div className="text-gray-500">No data available</div>
  }

  const colors = [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#14b8a6',
    '#f97316',
  ]

  const total = data.reduce((sum, d) => sum + d.value, 0)
  let currentAngle = -90

  const slices = data.map((point, i) => {
    const percentage = (point.value / total) * 100
    const sliceAngle = (percentage / 100) * 360
    const radius = size / 2 - 20

    // Calculate path
    const startAngle = (currentAngle * Math.PI) / 180
    const endAngle = ((currentAngle + sliceAngle) * Math.PI) / 180

    const x1 = Math.cos(startAngle) * radius
    const y1 = Math.sin(startAngle) * radius
    const x2 = Math.cos(endAngle) * radius
    const y2 = Math.sin(endAngle) * radius

    const largeArc = sliceAngle > 180 ? 1 : 0
    const path = `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`

    const midAngle = currentAngle + sliceAngle / 2
    const labelRadius = radius * 0.7
    const labelX = Math.cos((midAngle * Math.PI) / 180) * labelRadius
    const labelY = Math.sin((midAngle * Math.PI) / 180) * labelRadius

    currentAngle += sliceAngle

    return {
      path,
      color: colors[i % colors.length],
      label: point.label,
      percentage,
      value: point.value,
      labelX,
      labelY,
    }
  })

  return (
    <div className={clsx('bg-white rounded-lg p-6', className)}>
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      
      <div className="flex gap-8">
        <svg width={size} height={size} viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}>
          {slices.map((slice, i) => (
            <g key={i}>
              <path d={slice.path} fill={slice.color} opacity="0.8" />
              
              {slice.percentage > 8 && (
                <text
                  x={slice.labelX}
                  y={slice.labelY}
                  fontSize="12"
                  fill="white"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {slice.percentage.toFixed(0)}%
                </text>
              )}
            </g>
          ))}
        </svg>

        {showLegend && (
          <div className="space-y-2">
            {slices.map((slice, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: slice.color, opacity: 0.8 }}
                />
                <span className="text-sm text-gray-700">{slice.label}</span>
                <span className="text-sm font-medium text-gray-900">
                  {slice.percentage.toFixed(1)}%
                </span>
                <span className="text-xs text-gray-500">({slice.value})</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface LineChartProps {
  /**
   * Chart title
   */
  title?: string
  /**
   * Series data (multiple lines)
   */
  series: Array<{
    name: string
    data: number[]
    color?: string
  }>
  /**
   * X-axis labels
   */
  labels: string[]
  /**
   * Chart height in pixels
   */
  height?: number
  /**
   * Show grid lines
   */
  showGrid?: boolean
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * Simple Line Chart Component
 */
export const LineChart: React.FC<LineChartProps> = ({
  title,
  series,
  labels,
  height = 300,
  showGrid = true,
  className,
}) => {
  if (!series || series.length === 0 || !labels || labels.length === 0) {
    return <div className="text-gray-500">No data available</div>
  }

  const allValues = series.flatMap((s) => s.data)
  const maxValue = Math.max(...allValues)
  const minValue = Math.min(...allValues)
  const range = maxValue - minValue || 1

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
  const chartWidth = 800
  const padding = 60

  return (
    <div className={clsx('bg-white rounded-lg p-6', className)}>
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${chartWidth} ${height}`}
        className="overflow-x-auto"
      >
        {/* Grid lines */}
        {showGrid &&
          Array.from({ length: 5 }).map((_, i) => (
            <line
              key={`grid-${i}`}
              x1={padding}
              y1={padding + (height * i) / 4}
              x2={chartWidth - padding}
              y2={padding + (height * i) / 4}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}

        {/* Series lines */}
        {series.map((s, seriesIdx) => {
          const color = s.color || colors[seriesIdx % colors.length]
          const xStep = (chartWidth - padding * 2) / (s.data.length - 1)
          const points = s.data
            .map((value, i) => {
              const x = padding + i * xStep
              const y = height - padding - ((value - minValue) / range) * (height - padding * 2)
              return `${x},${y}`
            })
            .join(' ')

          return (
            <polyline
              key={`series-${seriesIdx}`}
              points={points}
              fill="none"
              stroke={color}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          )
        })}

        {/* X-axis labels */}
        {labels.map((label, i) => {
          const xStep = (chartWidth - padding * 2) / (labels.length - 1)
          const x = padding + i * xStep
          return (
            <text
              key={`label-${i}`}
              x={x}
              y={height - padding / 2}
              fontSize="12"
              fill="#6b7280"
              textAnchor="middle"
            >
              {label}
            </text>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="flex gap-6 mt-4">
        {series.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-0.5" style={{ backgroundColor: s.color || colors[i] }} />
            <span className="text-sm text-gray-700">{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
