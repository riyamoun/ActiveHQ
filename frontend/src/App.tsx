import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

// Layouts
import AuthLayout from '@/layouts/AuthLayout'
import DashboardLayout from '@/layouts/DashboardLayout'

// Public Site Pages (NEW - Premium B2B site)
import {
  PublicLayout,
  HomePage,
  ForGymOwnersPage,
  GymsOnActiveHQPage,
  ContactPage,
} from '@/pages/public'

// Operational Landing (internal preview)
import LandingPage from '@/pages/landing'

// Auth Pages
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'

// Dashboard Pages
import DashboardPage from '@/pages/dashboard/DashboardPage'
import MembersPage from '@/pages/members/MembersPage'
import MemberDetailPage from '@/pages/members/MemberDetailPage'
import AddMemberPage from '@/pages/members/AddMemberPage'
import PlansPage from '@/pages/plans/PlansPage'
import MembershipsPage from '@/pages/memberships/MembershipsPage'
import PaymentsPage from '@/pages/payments/PaymentsPage'
import AttendancePage from '@/pages/attendance/AttendancePage'
import ReportsPage from '@/pages/reports/ReportsPage'
import SettingsPage from '@/pages/settings/SettingsPage'

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

// Public Route (redirect to dashboard if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      {/* ═══════════════════════════════════════════════════════════════════
          PUBLIC SITE - Premium B2B Product Website
          3 core pages + contact
      ═══════════════════════════════════════════════════════════════════ */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/for-gym-owners" element={<ForGymOwnersPage />} />
        <Route path="/gyms" element={<GymsOnActiveHQPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>

      {/* ═══════════════════════════════════════════════════════════════════
          AUTH ROUTES
      ═══════════════════════════════════════════════════════════════════ */}
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
      </Route>

      {/* ═══════════════════════════════════════════════════════════════════
          DASHBOARD ROUTES (Protected)
      ═══════════════════════════════════════════════════════════════════ */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/members" element={<MembersPage />} />
        <Route path="/members/add" element={<AddMemberPage />} />
        <Route path="/members/:id" element={<MemberDetailPage />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/memberships" element={<MembershipsPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Operational system preview (internal) */}
      <Route path="/admin-preview" element={<LandingPage />} />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
