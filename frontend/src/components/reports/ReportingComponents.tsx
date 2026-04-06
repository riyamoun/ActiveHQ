import { useMemo } from 'react'
import { Calendar, TrendingUp } from 'lucide-react'

interface AttendanceData {
  date: string
  count: number
}

interface AttendanceHeatmapProps {
  data: AttendanceData[]
  title?: string
}

export function AttendanceHeatmap({
  data,
  title = 'Attendance Heatmap',
}: AttendanceHeatmapProps) {
  // Get last 12 weeks
  const weeks = useMemo(() => {
    const today = new Date()
    const weeks = []

    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(today)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() - i * 7)

      const weekData = []
      for (let j = 0; j < 7; j++) {
        const date = new Date(weekStart)
        date.setDate(date.getDate() + j)
        const dateStr = date.toISOString().split('T')[0]
        const count = data.find((d) => d.date === dateStr)?.count || 0

        weekData.push({
          date: dateStr,
          count,
          dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][j],
        })
      }
      weeks.push(weekData)
    }

    return weeks
  }, [data])

  // Get max count for color scaling
  const maxCount = Math.max(...data.map((d) => d.count), 1)

  // Get color based on intensity
  const getColor = (count: number) => {
    const intensity = count / maxCount
    if (intensity === 0) return 'bg-gray-100'
    if (intensity < 0.25) return 'bg-green-100'
    if (intensity < 0.5) return 'bg-green-300'
    if (intensity < 0.75) return 'bg-green-500'
    return 'bg-green-700'
  }

  const stats = useMemo(() => {
    const total = data.reduce((sum, d) => sum + d.count, 0)
    const avgPerDay = Math.round(total / (data.length || 1))
    const maxDay = Math.max(...data.map((d) => d.count), 0)

    return { total, avgPerDay, maxDay }
  }, [data])

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          {title}
        </h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded">
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          <p className="text-xs text-gray-600">Total Check-ins</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded">
          <p className="text-2xl font-bold text-green-600">{stats.avgPerDay}</p>
          <p className="text-xs text-gray-600">Avg/Day</p>
        </div>
        <div className="text-center p-3 bg-amber-50 rounded">
          <p className="text-2xl font-bold text-amber-600">{stats.maxDay}</p>
          <p className="text-xs text-gray-600">Max Day</p>
        </div>
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto">
        <div className="space-y-1 pb-4">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex gap-1">
              {week.map((day) => (
                <div
                  key={day.date}
                  className={`w-4 h-4 rounded ${getColor(day.count)} hover:ring-2 hover:ring-offset-2 hover:ring-blue-400 cursor-pointer transition-all`}
                  title={`${day.date}: ${day.count} check-ins`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4 text-xs text-gray-600">
        <span>Less</span>
        <div className="w-3 h-3 bg-gray-100" />
        <div className="w-3 h-3 bg-green-100" />
        <div className="w-3 h-3 bg-green-300" />
        <div className="w-3 h-3 bg-green-500" />
        <div className="w-3 h-3 bg-green-700" />
        <span>More</span>
      </div>
    </div>
  )
}

interface RevenueData {
  label: string
  value: number
  percentage: number
}

interface RevenueBreakdownProps {
  byPlan: RevenueData[]
  byMethod: RevenueData[]
  trend?: Array<{ date: string; amount: number }>
}

export function RevenueBreakdown({
  byPlan,
  byMethod,
  trend,
}: RevenueBreakdownProps) {
  const totalRevenue = useMemo(() => {
    return byPlan.reduce((sum, item) => sum + item.value, 0)
  }, [byPlan])

  // Get color for pie segments
  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-amber-500',
    'bg-green-500',
    'bg-cyan-500',
  ]

  return (
    <div className="space-y-6">
      {/* Total Revenue */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600">Total Revenue</p>
            <p className="text-4xl font-bold text-gray-900 mt-2">
              ₹{(totalRevenue / 100000).toFixed(1)}L
            </p>
          </div>
          <TrendingUp className="w-16 h-16 text-green-500 opacity-20" />
        </div>
      </div>

      {/* By Plan */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Plan</h3>
        <div className="space-y-3">
          {byPlan.map((item, idx) => (
            <div key={item.label}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
                <span className="text-sm font-bold text-gray-900">
                  ₹{(item.value / 1000).toFixed(0)}K ({item.percentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`${colors[idx % colors.length]} h-2 rounded-full`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* By Method */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Payment Method</h3>
        <div className="grid grid-cols-3 gap-4">
          {byMethod.map((item, idx) => (
            <div key={item.label} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`w-12 h-12 ${colors[idx % colors.length]} rounded-full mx-auto mb-2`} />
              <p className="text-sm font-medium text-gray-700">{item.label}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                ₹{(item.value / 1000).toFixed(0)}K
              </p>
              <p className="text-xs text-gray-600 mt-1">{item.percentage}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700">
          Export CSV
        </button>
      </div>
    </div>
  )
}
