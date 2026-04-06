# Phase 2 Frontend Integration Guide

## Quick Start - 30 Minutes Integration

### Step 1: Initialize Theme on App Startup (5 min)

**File:** `frontend/src/App.tsx`

```tsx
import { useEffect } from 'react'
import { useThemeStore } from '@/store/themeStore'

export function App() {
  // Initialize theme on mount
  useEffect(() => {
    useThemeStore.getState().initializeTheme()
  }, [])

  return (
    <div>
      {/* Your app content */}
    </div>
  )
}
```

### Step 2: Add Theme Toggle to Navbar (5 min)

**File:** `frontend/src/layouts/Navbar.tsx` (or wherever your navbar is)

```tsx
import { ThemeToggle } from '@/components/ThemeToggle'

export function Navbar() {
  return (
    <nav className="bg-white dark:bg-gray-900">
      <div className="px-4 py-3 flex justify-between items-center">
        <h1>ActiveHQ</h1>
        
        {/* Add this */}
        <ThemeToggle />
      </div>
    </nav>
  )
}
```

### Step 3: Update Members Page with Filtering (10 min)

**File:** `frontend/src/pages/members/MembersPage.tsx`

```tsx
import { useState } from 'react'
import { AdvancedFilterBar, type MemberFilters } from '@/components/members/AdvancedFilterBar'
import { BulkImportModal } from '@/components/members/BulkImportModal'

export function MembersPage() {
  const [filters, setFilters] = useState<MemberFilters>({})
  const [showImport, setShowImport] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Members</h1>
        <button
          onClick={() => setShowImport(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          📥 Bulk Import
        </button>
      </div>

      {/* Add filters */}
      <AdvancedFilterBar
        filters={filters}
        onChange={setFilters}
        onClear={() => setFilters({})}
        membershipTypes={['Basic', 'Premium', 'VIP']} // From your plans
      />

      {/* Bulk import modal */}
      <BulkImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onSuccess={(result) => {
          console.log(`✅ Imported ${result.successful}/${result.total_records} members`)
          // Refresh members list here
        }}
      />

      {/* Members list - pass filters to API */}
      <MembersList filters={filters} />
    </div>
  )
}

// Update your members API call to use filters
function MembersList({ filters }: { filters: MemberFilters }) {
  // When calling API, pass filters as query params
  // /api/v1/members?query=John&status=active&page=1
  // Already supported by backend!
}
```

### Step 4: Add Admin Page Route (5 min)

**File:** `frontend/src/App.tsx` (or your routing config)

```tsx
import { AdminGymsPage } from '@/pages/admin/AdminGymsPage'

// Add this route (protect with super_admin role check)
function ProtectedRoute({ children, requiredRole }: any) {
  const user = useAuthStore((state) => state.user)
  
  if (user?.role !== requiredRole) {
    return <div>Access Denied</div>
  }
  
  return children
}

// In your routing:
export const routes = [
  // ... existing routes
  {
    path: '/admin/gyms',
    element: (
      <ProtectedRoute requiredRole="super_admin">
        <AdminGymsPage />
      </ProtectedRoute>
    ),
  },
]
```

### Step 5: Add Reporting Page (5 min)

**File:** `frontend/src/pages/reports/ReportsPage.tsx`

```tsx
import { AttendanceHeatmap, RevenueBreakdown } from '@/components/reports/ReportingComponents'
import { useQuery } from '@tanstack/react-query'

export function ReportsPage() {
  // Fetch attendance data
  const attendanceQuery = useQuery({
    queryKey: ['reports', 'attendance'],
    queryFn: () => fetch('/api/v1/attendance/heatmap').then(r => r.json()),
  })

  // Fetch revenue data
  const revenueQuery = useQuery({
    queryKey: ['reports', 'revenue'],
    queryFn: () => fetch('/api/v1/reports/revenue').then(r => r.json()),
  })

  if (attendanceQuery.isPending || revenueQuery.isPending) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Reports</h1>

      <AttendanceHeatmap
        data={attendanceQuery.data}
        title="12-Week Attendance"
      />

      <RevenueBreakdown
        byPlan={revenueQuery.data?.byPlan}
        byMethod={revenueQuery.data?.byMethod}
      />
    </div>
  )
}
```

---

## Advanced Integration - Custom Examples

### Complete Members Page Example

```tsx
import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AdvancedFilterBar, type MemberFilters } from '@/components/members/AdvancedFilterBar'
import { BulkImportModal } from '@/components/members/BulkImportModal'
import { apiClient } from '@/services/api'

export function MembersPage() {
  const [filters, setFilters] = useState<MemberFilters>({})
  const [page, setPage] = useState(1)
  const [showImport, setShowImport] = useState(false)

  // Build query params from filters
  const queryParams = {
    query: filters.query,
    status: filters.status || 'all',
    page,
    page_size: 20,
    joined_from: filters.joinedDateFrom,
    joined_to: filters.joinedDateTo,
    membership_type: filters.membershipType,
  }

  // Fetch members with filters
  const membersQuery = useQuery({
    queryKey: ['members', queryParams],
    queryFn: () => apiClient.get('/members', { params: queryParams }),
  })

  const handleImportSuccess = useCallback((result: any) => {
    console.log(`Imported ${result.successful} members`)
    // Refresh members list
    membersQuery.refetch()
    setShowImport(false)
  }, [membersQuery])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Members</h1>
          <p className="text-gray-600 mt-1">Manage your gym members</p>
        </div>
        <button
          onClick={() => setShowImport(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Upload className="w-4 h-4" />
          Bulk Import
        </button>
      </div>

      {/* Advanced Filters */}
      <AdvancedFilterBar
        filters={filters}
        onChange={setFilters}
        onClear={() => {
          setFilters({})
          setPage(1)
        }}
        membershipTypes={['Basic', 'Premium', 'VIP']}
      />

      {/* Members Table */}
      {membersQuery.isPending ? (
        <div>Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Phone</th>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {membersQuery.data?.items?.map((member: any) => (
                <tr key={member.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3">{member.name}</td>
                  <td className="px-6 py-3">{member.phone}</td>
                  <td className="px-6 py-3">{member.email}</td>
                  <td className="px-6 py-3">{member.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bulk Import Modal */}
      <BulkImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  )
}
```

### Using Filters with URL State (Advanced)

```tsx
import { useSearchParams } from 'react-router-dom'
import { type MemberFilters } from '@/components/members/AdvancedFilterBar'

export function MembersPageWithURL() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Restore filters from URL
  const filters: MemberFilters = {
    query: searchParams.get('q') || undefined,
    status: (searchParams.get('status') as any) || 'all',
    membershipType: searchParams.get('type') || undefined,
    joinedDateFrom: searchParams.get('from') || undefined,
    joinedDateTo: searchParams.get('to') || undefined,
  }

  // Update URL when filters change
  const handleFilterChange = (newFilters: MemberFilters) => {
    const params = new URLSearchParams()
    if (newFilters.query) params.set('q', newFilters.query)
    if (newFilters.status && newFilters.status !== 'all') {
      params.set('status', newFilters.status)
    }
    if (newFilters.membershipType) params.set('type', newFilters.membershipType)
    if (newFilters.joinedDateFrom) params.set('from', newFilters.joinedDateFrom)
    if (newFilters.joinedDateTo) params.set('to', newFilters.joinedDateTo)

    setSearchParams(params)
  }

  return (
    <AdvancedFilterBar
      filters={filters}
      onChange={handleFilterChange}
      onClear={() => setSearchParams({})}
    />
  )
}
```

---

## 🎨 Styling & Customization

### Dark Mode CSS Classes

Tailwind CSS dark mode is enabled with `class` strategy. Add `dark:` prefix to classes:

```tsx
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
  Content that adapts to theme
</div>
```

### Extending Theme Colors

**File:** `tailwind.config.js`

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        'activehq-blue': '#2563eb',
        'activehq-green': '#10b981',
      },
    },
  },
}
```

### Custom Filter Styling

```tsx
import { AdvancedFilterBar } from '@/components/members/AdvancedFilterBar'

export function CustomStyledFilters() {
  return (
    <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
      <AdvancedFilterBar
        filters={filters}
        onChange={setFilters}
        onClear={() => setFilters({})}
      />
    </div>
  )
}
```

---

## 🧪 Testing Components Locally

```tsx
// Test AttendanceHeatmap
import { AttendanceHeatmap } from '@/components/reports/ReportingComponents'

function TestHeatmap() {
  const mockData = Array.from({ length: 84 }, (_, i) => ({
    date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
    count: Math.floor(Math.random() * 100),
  }))

  return <AttendanceHeatmap data={mockData} />
}

// Test BulkImportModal
import { BulkImportModal } from '@/components/members/BulkImportModal'

function TestBulkImport() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Import</button>
      <BulkImportModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={(result) => console.log('Success:', result)}
      />
    </>
  )
}
```

---

## 🔐 Protected Routes Example

```tsx
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'super_admin' | 'owner' | 'manager' | 'staff'
}

export function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const user = useAuthStore((state) => state.user)

  if (!user) {
    return <Navigate to="/login" />
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" />
  }

  return <>{children}</>
}

// Usage
<Route
  path="/admin/gyms"
  element={
    <ProtectedRoute requiredRole="super_admin">
      <AdminGymsPage />
    </ProtectedRoute>
  }
/>
```

---

## 📝 API Integration Notes

### Members Filtering (Already Supported)
```
GET /api/v1/members?query=John&status=active&page=1&page_size=20
```

### Bulk Import Endpoint (New)
```
POST /api/v1/members/import/bulk
Content-Type: multipart/form-data

file: <CSV or JSON file>
```

### Admin Endpoints (Already Implemented)
```
GET /api/v1/admin/stats
GET /api/v1/admin/gyms?page=1&page_size=20
GET /api/v1/admin/gyms/{gym_id}
GET /api/v1/admin/users?role=owner
```

---

**Last Updated:** April 6, 2026  
**Ready for Integration:** ✅ Yes
