import { useState } from 'react'
import { Search, X, ChevronDown } from 'lucide-react'

export interface MemberFilters {
  query?: string
  status?: 'active' | 'expired' | 'pending' | 'all'
  membershipType?: string
  joinedDateFrom?: string
  joinedDateTo?: string
}

interface AdvancedFilterBarProps {
  filters: MemberFilters
  onChange: (filters: MemberFilters) => void
  onClear: () => void
  membershipTypes?: string[]
}

export function AdvancedFilterBar({
  filters,
  onChange,
  onClear,
  membershipTypes = [],
}: AdvancedFilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const hasActiveFilters =
    (filters.query && filters.query.length > 0) ||
    (filters.status && filters.status !== 'all') ||
    filters.membershipType ||
    filters.joinedDateFrom ||
    filters.joinedDateTo

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      {/* Main Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone, or member code..."
            value={filters.query || ''}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          Filters
        </button>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status || 'all'}
              onChange={(e) =>
                onChange({
                  ...filters,
                  status: (e.target.value as any) || 'all',
                })
              }
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Membership Type Filter */}
          {membershipTypes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Membership Type
              </label>
              <select
                value={filters.membershipType || ''}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    membershipType: e.target.value || undefined,
                  })
                }
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                {membershipTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Joined Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Joined From</label>
            <input
              type="date"
              value={filters.joinedDateFrom || ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  joinedDateFrom: e.target.value || undefined,
                })
              }
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Joined Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Joined To</label>
            <input
              type="date"
              value={filters.joinedDateTo || ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  joinedDateTo: e.target.value || undefined,
                })
              }
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.query && (
            <FilterTag
              label={`Search: "${filters.query}"`}
              onRemove={() => onChange({ ...filters, query: '' })}
            />
          )}
          {filters.status && filters.status !== 'all' && (
            <FilterTag
              label={`Status: ${filters.status}`}
              onRemove={() => onChange({ ...filters, status: 'all' })}
            />
          )}
          {filters.membershipType && (
            <FilterTag
              label={`Type: ${filters.membershipType}`}
              onRemove={() => onChange({ ...filters, membershipType: undefined })}
            />
          )}
          {filters.joinedDateFrom && (
            <FilterTag
              label={`From: ${filters.joinedDateFrom}`}
              onRemove={() => onChange({ ...filters, joinedDateFrom: undefined })}
            />
          )}
          {filters.joinedDateTo && (
            <FilterTag
              label={`To: ${filters.joinedDateTo}`}
              onRemove={() => onChange({ ...filters, joinedDateTo: undefined })}
            />
          )}
        </div>
      )}
    </div>
  )
}

interface FilterTagProps {
  label: string
  onRemove: () => void
}

function FilterTag({ label, onRemove }: FilterTagProps) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
      <span>{label}</span>
      <button onClick={onRemove} className="hover:text-blue-900">
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}
