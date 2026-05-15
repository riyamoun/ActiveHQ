import { Link, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

// Layouts
import AuthLayout from '@/layouts/AuthLayout'
import DashboardLayout from '@/layouts/DashboardLayout'

// Public Site Pages (NEW - Premium B2B site)
import {
  PublicLayout,
  HomePage,
  CoachPage,
  ForGymOwnersPage,
  GymsOnActiveHQPage,
  ContactPage,
  PrivacyPage,
  TermsPage,
} from '@/pages/public'

// Operational Landing (internal preview)
import LandingPage from '@/pages/landing'

// Member Portal (mobile-first dark app for gym members)
import {
  MemberLayout,
  MemberLoginPage,
  MemberSelectGymPage,
  MemberMagicLinkPage,
  MemberDashboardPage,
  MemberAttendancePage,
  MemberPaymentsPage,
  MemberProfilePage,
} from '@/pages/member'

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
import ImportDataPage from '@/pages/settings/ImportDataPage'
import BiometricSettingsPage from '@/pages/settings/BiometricSettingsPage'

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

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-6 text-center">
      <div className="max-w-md">
        <p className="text-lime-400 text-sm tracking-[0.3em] uppercase mb-4">404</p>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Page <span className="text-lime-400">not found.</span>
        </h1>
        <p className="text-white/50 mb-8">
          The page you're looking for doesn't exist or has moved.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="px-6 py-3 bg-lime-400 text-black rounded-full hover:bg-lime-300 transition-colors text-sm font-bold"
          >
            Back to home
          </Link>
          <Link
            to="/contact"
            className="px-6 py-3 border border-white/20 text-white rounded-full hover:border-lime-400/60 hover:text-lime-400 transition-colors text-sm"
          >
            Talk to us
          </Link>
        </div>
      </div>
    </div>
  )
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
        <Route path="/coach" element={<CoachPage />} />
        <Route path="/for-gym-owners" element={<ForGymOwnersPage />} />
        <Route path="/gyms" element={<GymsOnActiveHQPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
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
        <Route path="/settings/biometric" element={<BiometricSettingsPage />} />
        <Route path="/settings/import" element={<ImportDataPage />} />
      </Route>

      {/* Operational system preview (internal) */}
      <Route path="/admin-preview" element={<LandingPage />} />

      {/* ═══════════════════════════════════════════════════════════════════
          MEMBER PORTAL (mobile-first, separate auth from staff)
      ═══════════════════════════════════════════════════════════════════ */}
      <Route path="/m/login" element={<MemberLoginPage />} />
      <Route path="/m/select-gym" element={<MemberSelectGymPage />} />
      <Route path="/m/auth/magic-link" element={<MemberMagicLinkPage />} />
      <Route element={<MemberLayout />}>
        <Route path="/m" element={<MemberDashboardPage />} />
        <Route path="/m/attendance" element={<MemberAttendancePage />} />
        <Route path="/m/payments" element={<MemberPaymentsPage />} />
        <Route path="/m/profile" element={<MemberProfilePage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
