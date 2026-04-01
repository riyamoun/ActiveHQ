import clsx from 'clsx'

interface Column<T> {
  key: string
  header: string
  render?: (item: T) => React.ReactNode
  className?: string
}

interface TableProps<T> {
  data: T[]
  columns: Column<T>[]
  onRowClick?: (item: T) => void
  emptyMessage?: string
  isLoading?: boolean
}

export default function Table<T extends { id: string }>({
  data,
  columns,
  onRowClick,
  emptyMessage = 'No data found',
  isLoading = false,
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 overflow-hidden">
        <div className="p-8 text-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-4 bg-slate-800 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-slate-800 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 overflow-hidden">
        <div className="p-8 text-center text-slate-500">{emptyMessage}</div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800/60">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={clsx(
                    'px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider',
                    column.className
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {data.map((item) => (
              <tr
                key={item.id}
                onClick={() => onRowClick?.(item)}
                className={clsx(
                  'hover:bg-slate-800/30 transition-colors',
                  onRowClick && 'cursor-pointer'
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={clsx('px-6 py-4 whitespace-nowrap text-slate-300', column.className)}
                  >
                    {column.render
                      ? column.render(item)
                      : (item as Record<string, unknown>)[column.key]?.toString()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
