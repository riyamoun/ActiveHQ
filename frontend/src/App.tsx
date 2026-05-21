import { lazy, Suspense } from 'react'
import { Link, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { PageLoader } from '@/components/ui/LoadingSpinner'

import AuthLayout from '@/layouts/AuthLayout'
import DashboardLayout from '@/layouts/DashboardLayout'
import {
  PublicLayout,
  HomePage,
  CoachPage,
  ForGymOwnersPage,
  GymsOnActiveHQPage,
  ContactPage,
  PrivacyPage,
  TermsPage,
  AccountDeletePage,
} from '@/pages/public'
import {
  MemberLayout,
  MemberLoginPage,
  MemberSelectGymPage,
  MemberMagicLinkPage,
} from '@/pages/member'

const LandingPage = lazy(() => import('@/pages/landing'))
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'))
const MembersPage = lazy(() => import('@/pages/members/MembersPage'))
const MemberDetailPage = lazy(() => import('@/pages/members/MemberDetailPage'))
const AddMemberPage = lazy(() => import('@/pages/members/AddMemberPage'))
const PlansPage = lazy(() => import('@/pages/plans/PlansPage'))
const MembershipsPage = lazy(() => import('@/pages/memberships/MembershipsPage'))
const PaymentsPage = lazy(() => import('@/pages/payments/PaymentsPage'))
const AttendancePage = lazy(() => import('@/pages/attendance/AttendancePage'))
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage'))
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'))
const ImportDataPage = lazy(() => import('@/pages/settings/ImportDataPage'))
const BiometricSettingsPage = lazy(() => import('@/pages/settings/BiometricSettingsPage'))
const MemberDashboardPage = lazy(() =>
  import('@/pages/member/MemberDashboardPage').then((m) => ({ default: m.MemberDashboardPage }))
)
const MemberAttendancePage = lazy(() =>
  import('@/pages/member/MemberAttendancePage').then((m) => ({ default: m.MemberAttendancePage }))
)
const MemberPaymentsPage = lazy(() =>
  import('@/pages/member/MemberPaymentsPage').then((m) => ({ default: m.MemberPaymentsPage }))
)
const MemberProfilePage = lazy(() =>
  import('@/pages/member/MemberProfilePage').then((m) => ({ default: m.MemberProfilePage }))
)

function RouteFallback() {
  return <PageLoader />
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

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
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/coach" element={<CoachPage />} />
          <Route path="/for-gym-owners" element={<ForGymOwnersPage />} />
          <Route path="/gyms" element={<GymsOnActiveHQPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/account/delete" element={<AccountDeletePage />} />
        </Route>

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

        <Route path="/admin-preview" element={<LandingPage />} />

        <Route path="/m/login" element={<MemberLoginPage />} />
        <Route path="/m/select-gym" element={<MemberSelectGymPage />} />
        <Route path="/m/auth/magic-link" element={<MemberMagicLinkPage />} />
        <Route element={<MemberLayout />}>
          <Route path="/m" element={<MemberDashboardPage />} />
          <Route path="/m/attendance" element={<MemberAttendancePage />} />
          <Route path="/m/payments" element={<MemberPaymentsPage />} />
          <Route path="/m/profile" element={<MemberProfilePage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
