# Super Admin Panel — Full Implementation Guide

**Priority:** High (enables multi-gym scaling)  
**Effort:** 3-4 days (backend 2 days + frontend 2 days)  
**Impact:** Platform-level operations + support tools + analytics

---

## Architecture Overview

```
/admin/
├── dashboard/          ← System overview, key metrics
├── gyms/               ← All gyms, subscription status, activity
├── users/              ← All users across all gyms, role management
├── analytics/          ← Platform-wide metrics, trends
├── support/            ← Demo requests, escalations
├── billing/            ← Subscription management
└── settings/           ← Platform configuration
```

## Backend Requirements

### 1. RBAC Enhancement - Super Admin Role

**File:** `backend/app/models/enums.py`

Add to UserRole:
```python
class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"  # ← ADD THIS
    OWNER = "owner"
    MANAGER = "manager"
    STAFF = "staff"
```

### 2. Dependency for Super Admin Only

**File:** `backend/app/auth/dependencies.py`

```python
async def require_super_admin(
    current_user: CurrentUserDep,
) -> User:
    """Only super_admin can access this endpoint."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Super admin access required"
        )
    return current_user

# Type alias
SuperAdminDep = Annotated[User, Depends(require_super_admin)]
```

### 3. Admin Service APIs

**File:** `backend/app/admin/service.py`

```python
from sqlalchemy import func
from app.models import Gym, User, Payment, Member, Membership
from app.models.enums import UserRole, MembershipStatus

class AdminService:
    def __init__(self, db: Session):
        self.db = db
    
    # GYMS
    def list_all_gyms(self, page: int = 1, page_size: int = 20):
        """List all gyms with subscription status and activity."""
        query = self.db.query(Gym).order_by(Gym.created_at.desc())
        
        total = query.count()
        gyms = query.offset((page-1)*page_size).limit(page_size).all()
        
        return {
            "items": [
                {
                    "id": gym.id,
                    "name": gym.name,
                    "phone": gym.phone,
                    "city": gym.city,
                    "subscription_status": gym.subscription_status,
                    "subscription_end": gym.subscription_end,
                    "is_active": gym.is_active,
                    "members_count": self.db.query(Member).filter(
                        Member.gym_id == gym.id
                    ).count(),
                    "revenue_this_month": self.get_gym_revenue(gym.id),
                    "last_activity": self.get_gym_last_activity(gym.id),
                    "created_at": gym.created_at,
                }
                for gym in gyms
            ],
            "page": page,
            "page_size": page_size,
            "total": total,
        }
    
    def get_gym_detail(self, gym_id: int):
        """Get detailed info about a gym."""
        gym = self.db.query(Gym).filter(Gym.id == gym_id).first()
        if not gym:
            raise ValueError("Gym not found")
        
        members = self.db.query(Member).filter(Member.gym_id == gym_id).all()
        active_members = sum(1 for m in members if m.is_active)
        
        return {
            "id": gym.id,
            "name": gym.name,
            "email": gym.email,
            "phone": gym.phone,
            "address": gym.address,
            "city": gym.city,
            "state": gym.state,
            "subscription_status": gym.subscription_status,
            "subscription_end": gym.subscription_end,
            "is_active": gym.is_active,
            "total_members": len(members),
            "active_members": active_members,
            "revenue_all_time": self.get_gym_revenue(gym_id),
            "revenue_this_month": self.get_gym_revenue(gym_id, days=30),
            "created_at": gym.created_at,
            "users": [
                {
                    "id": user.id,
                    "email": user.email,
                    "full_name": user.full_name,
                    "role": user.role,
                    "is_active": user.is_active,
                }
                for user in self.db.query(User).filter(User.gym_id == gym_id).all()
            ],
        }
    
    def toggle_gym_status(self, gym_id: int, is_active: bool):
        """Enable/disable entire gym."""
        gym = self.db.query(Gym).filter(Gym.id == gym_id).first()
        if not gym:
            raise ValueError("Gym not found")
        
        gym.is_active = is_active
        self.db.commit()
        
        from app.core.logger import log_info
        log_info(f"Gym {gym.name} status changed", gym_id=gym_id, is_active=is_active)
        
        return gym
    
    # USERS
    def list_all_users(self, role: str = None, page: int = 1, page_size: int = 20):
        """List all users across all gyms."""
        query = self.db.query(User)
        
        if role:
            query = query.filter(User.role == role)
        
        query = query.order_by(User.created_at.desc())
        total = query.count()
        users = query.offset((page-1)*page_size).limit(page_size).all()
        
        return {
            "items": [
                {
                    "id": user.id,
                    "email": user.email,
                    "full_name": user.full_name,
                    "gym_id": user.gym_id,
                    "gym_name": self.db.query(Gym).filter(
                        Gym.id == user.gym_id
                    ).first().name if user.gym_id else None,
                    "role": user.role,
                    "is_active": user.is_active,
                    "created_at": user.created_at,
                    "last_login": getattr(user, "last_login", None),
                }
                for user in users
            ],
            "page": page,
            "page_size": page_size,
            "total": total,
        }
    
    def toggle_user_status(self, user_id: int, is_active: bool):
        """Enable/disable user access."""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        user.is_active = is_active
        self.db.commit()
        
        from app.core.logger import log_info
        log_info(f"User {user.email} status changed", user_id=user_id, is_active=is_active)
        
        return user
    
    # ANALYTICS
    def get_platform_stats(self):
        """Platform-wide metrics."""
        total_gyms = self.db.query(func.count(Gym.id)).scalar() or 0
        active_gyms = self.db.query(func.count(Gym.id)).filter(
            Gym.is_active == True
        ).scalar() or 0
        
        total_members = self.db.query(func.count(Member.id)).scalar() or 0
        active_members = self.db.query(func.count(Member.id)).filter(
            Member.is_active == True
        ).scalar() or 0
        
        total_users = self.db.query(func.count(User.id)).scalar() or 0
        total_owners = self.db.query(func.count(User.id)).filter(
            User.role == UserRole.OWNER
        ).scalar() or 0
        
        # Revenue this month (all gyms)
        from datetime import datetime, timedelta
        start_of_month = datetime.now().replace(day=1).date()
        revenue = self.db.query(func.sum(Payment.amount)).filter(
            Payment.payment_date >= start_of_month
        ).scalar() or 0
        
        return {
            "gyms": {
                "total": total_gyms,
                "active": active_gyms,
                "inactive": total_gyms - active_gyms,
            },
            "members": {
                "total": total_members,
                "active": active_members,
                "inactive": total_members - active_members,
            },
            "users": {
                "total": total_users,
                "owners": total_owners,
                "managers": self.db.query(func.count(User.id)).filter(
                    User.role == UserRole.MANAGER
                ).scalar() or 0,
                "staff": self.db.query(func.count(User.id)).filter(
                    User.role == UserRole.STAFF
                ).scalar() or 0,
            },
            "revenue": {
                "this_month": float(revenue),
            },
        }
    
    # SUPPORT
    def list_demo_requests(self, page: int = 1, page_size: int = 20):
        """Get all demo requests."""
        from app.models.demo_request import DemoRequest
        
        query = self.db.query(DemoRequest).order_by(
            DemoRequest.created_at.desc()
        )
        total = query.count()
        requests = query.offset((page-1)*page_size).limit(page_size).all()
        
        return {
            "items": [
                {
                    "id": req.id,
                    "name": req.name,
                    "gym_name": req.gym_name,
                    "phone": req.phone,
                    "city": req.city,
                    "created_at": req.created_at,
                    "status": getattr(req, "status", "pending"),
                }
                for req in requests
            ],
            "page": page,
            "page_size": page_size,
            "total": total,
        }
    
    # HELPERS
    def get_gym_revenue(self, gym_id: int, days: int = None):
        """Total revenue for a gym."""
        query = self.db.query(func.sum(Payment.amount)).filter(
            Payment.membership_id.in_(
                self.db.query(Membership.id).filter(
                    Membership.gym_id == gym_id
                )
            )
        )
        
        if days:
            from datetime import datetime, timedelta
            start_date = datetime.now().date() - timedelta(days=days)
            query = query.filter(Payment.payment_date >= start_date)
        
        total = query.scalar() or 0
        return float(total)
    
    def get_gym_last_activity(self, gym_id: int):
        """Last activity timestamp for a gym."""
        from app.models import Payment, Attendance
        
        last_payment = self.db.query(func.max(Payment.payment_date)).filter(
            Payment.membership_id.in_(
                self.db.query(Membership.id).filter(
                    Membership.gym_id == gym_id
                )
            )
        ).scalar()
        
        last_checkin = self.db.query(func.max(Attendance.check_in_time)).filter(
            Attendance.gym_id == gym_id
        ).scalar()
        
        dates = [d for d in [last_payment, last_checkin] if d]
        return max(dates) if dates else None
```

### 4. Admin Router

**File:** `backend/app/admin/router.py`

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from app.auth.dependencies import SuperAdminDep, DbDep
from app.admin.service import AdminService

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

# Dashboard & Overview
@router.get("/stats")
def get_platform_stats(_: SuperAdminDep, db: DbDep):
    """Platform-wide metrics."""
    service = AdminService(db)
    return service.get_platform_stats()

# Gyms Management
@router.get("/gyms")
def list_gyms(
    _: SuperAdminDep,
    db: DbDep,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """List all gyms."""
    service = AdminService(db)
    return service.list_all_gyms(page, page_size)

@router.get("/gyms/{gym_id}")
def get_gym(_: SuperAdminDep, gym_id: int, db: DbDep):
    """Get gym details."""
    service = AdminService(db)
    try:
        return service.get_gym_detail(gym_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.patch("/gyms/{gym_id}/toggle")
def toggle_gym_status(
    _: SuperAdminDep,
    gym_id: int,
    is_active: bool,
    db: DbDep,
):
    """Enable/disable gym."""
    service = AdminService(db)
    try:
        return service.toggle_gym_status(gym_id, is_active)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# Users Management
@router.get("/users")
def list_users(
    _: SuperAdminDep,
    db: DbDep,
    role: str = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """List all users."""
    service = AdminService(db)
    return service.list_all_users(role, page, page_size)

@router.patch("/users/{user_id}/toggle")
def toggle_user_status(
    _: SuperAdminDep,
    user_id: int,
    is_active: bool,
    db: DbDep,
):
    """Enable/disable user."""
    service = AdminService(db)
    try:
        return service.toggle_user_status(user_id, is_active)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# Support & Leads
@router.get("/demo-requests")
def list_demo_requests(
    _: SuperAdminDep,
    db: DbDep,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """Get all demo requests."""
    service = AdminService(db)
    return service.list_demo_requests(page, page_size)
```

### 5. Register Router in Main

**File:** `backend/app/main.py`

Add at top:
```python
from app.admin import router as admin_router
```

Add before running app:
```python
app.include_router(admin_router.router)
```

---

## Frontend Implementation

### 1. Admin Layout & Navigation

**File:** `frontend/src/pages/admin/AdminLayout.tsx`

```tsx
import React from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { LayoutDashboard, Building2, Users, BarChart3, Mail, Settings } from 'lucide-react'

export default function AdminLayout() {
  const { user } = useAuthStore()

  // Only super_admin can access
  if (user?.role !== 'super_admin') {
    return <div className="p-8 text-red-600">Access Denied. Super Admin only.</div>
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
          <p className="text-sm text-gray-500">Platform Management</p>
        </div>

        <nav className="space-y-2 px-4">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-lg ${
                isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/admin/gyms"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-lg ${
                isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <Building2 size={20} />
            <span>Gyms</span>
          </NavLink>

          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-lg ${
                isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <Users size={20} />
            <span>Users</span>
          </NavLink>

          <NavLink
            to="/admin/analytics"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-lg ${
                isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <BarChart3 size={20} />
            <span>Analytics</span>
          </NavLink>

          <NavLink
            to="/admin/support"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-lg ${
                isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <Mail size={20} />
            <span>Support</span>
          </NavLink>

          <NavLink
            to="/admin/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-lg ${
                isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <Settings size={20} />
            <span>Settings</span>
          </NavLink>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="gyms" element={<GymsPage />} />
          <Route path="gyms/:gymId" element={<GymDetailPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="support" element={<SupportPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </div>
  )
}

// Placeholder components (implement separately)
function AdminDashboard() { return <div className="p-8">Dashboard Content</div> }
function GymsPage() { return <div className="p-8">Gyms Content</div> }
function GymDetailPage() { return <div className="p-8">Gym Detail Content</div> }
function UsersPage() { return <div className="p-8">Users Content</div> }
function AnalyticsPage() { return <div className="p-8">Analytics Content</div> }
function SupportPage() { return <div className="p-8">Support Content</div> }
function SettingsPage() { return <div className="p-8">Settings Content</div> }
```

### 2. Admin Dashboard (Main Stats)

**File:** `frontend/src/pages/admin/AdminDashboard.tsx`

```tsx
import { useQuery } from '@tanstack/react-query'
import Card, { CardHeader } from '@/components/ui/Card'
import StatCard from '@/components/ui/StatCard'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { Building2, Users, BarChart3, TrendingUp } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/v1/admin/stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      })
      return response.json()
    },
  })

  if (isLoading) return <PageLoader />

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="text-gray-500">System-wide metrics and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Gyms"
          value={stats?.gyms.total || 0}
          icon={<Building2 className="w-6 h-6" />}
          variant="primary"
        />
        <StatCard
          title="Active Gyms"
          value={stats?.gyms.active || 0}
          icon={<TrendingUp className="w-6 h-6" />}
          variant="success"
        />
        <StatCard
          title="Total Users"
          value={stats?.users.total || 0}
          icon={<Users className="w-6 h-6" />}
          variant="primary"
        />
        <StatCard
          title="Monthly Revenue"
          value={`₹${(stats?.revenue.this_month || 0).toLocaleString()}`}
          icon={<BarChart3 className="w-6 h-6" />}
          variant="success"
        />
      </div>

      {/* Member Stats */}
      <Card>
        <CardHeader title="Member Overview" />
        <div className="grid grid-cols-3 gap-6 p-6">
          <div>
            <p className="text-gray-500 text-sm">Total Members</p>
            <p className="text-3xl font-bold text-gray-900">{stats?.members.total || 0}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Active</p>
            <p className="text-3xl font-bold text-green-600">{stats?.members.active || 0}</p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Inactive</p>
            <p className="text-3xl font-bold text-red-600">{stats?.members.inactive || 0}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
```

### 3. Gyms Management Page

**File:** `frontend/src/pages/admin/GymsPage.tsx`

```tsx
import { useQuery, useMutation } from '@tanstack/react-query'
import Card, { CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { Eye, Power, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function GymsPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-gyms'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/v1/admin/gyms?page_size=100`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      })
      return response.json()
    },
  })

  const toggleGymMutation = useMutation({
    mutationFn: async ({ gymId, isActive }: { gymId: number; isActive: boolean }) => {
      const response = await fetch(`${API_URL}/api/v1/admin/gyms/${gymId}/toggle?is_active=${!isActive}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      })
      return response.json()
    },
    onSuccess: () => {
      toast.success('Gym status updated')
      refetch()
    },
    onError: () => toast.error('Failed to update gym'),
  })

  if (isLoading) return <PageLoader />

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Gyms</h1>
        <p className="text-gray-500">Monitor and manage all gyms in the platform</p>
      </div>

      <Card>
        <CardHeader title={`All Gyms (${data?.total || 0})`} />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Gym Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">City</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Members</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Revenue</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.items?.map((gym: any) => (
                <tr key={gym.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{gym.name}</td>
                  <td className="px-6 py-4 text-gray-600">{gym.city}</td>
                  <td className="px-6 py-4 text-gray-600">{gym.members_count}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    ₹{(gym.revenue_this_month || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={gym.is_active ? 'success' : 'danger'}>
                      {gym.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Eye size={16} />}
                    >
                      View
                    </Button>
                    <Button
                      variant={gym.is_active ? 'danger' : 'success'}
                      size="sm"
                      icon={<Power size={16} />}
                      isLoading={toggleGymMutation.isPending}
                      onClick={() =>
                        toggleGymMutation.mutate({
                          gymId: gym.id,
                          isActive: gym.is_active,
                        })
                      }
                    >
                      {gym.is_active ? 'Disable' : 'Enable'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
```

### 4. Add Admin Route to App.tsx

**File:** `frontend/src/App.tsx`

```tsx
import AdminLayout from '@/pages/admin/AdminLayout'

// Add to Routes:
<Route element={<AdminLayout />}>
  <Route path="/admin/*" element={<AdminLayout />} />
</Route>
```

---

## Testing

### Backend Tests

**File:** `backend/tests/test_admin.py`

```python
import pytest


class TestAdminAccess:
    """Test admin endpoint access control."""
    
    def test_admin_dashboard_requires_super_admin(self, client, owner_token):
        """Non-super-admin blocked from admin endpoints."""
        response = client.get(
            "/api/v1/admin/stats",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert response.status_code == 403

    def test_admin_dashboard_with_super_admin(self, client, db_session):
        """Super admin can access dashboard."""
        # Create super_admin user
        from app.core.security import hash_password
        from app.models import User, Gym
        from app.models.enums import UserRole
        
        gym = Gym(name="Test", phone="9999999999")
        db_session.add(gym)
        db_session.commit()
        
        admin = User(
            gym_id=gym.id,
            email="admin@test.com",
            password_hash=hash_password("Admin@123"),
            full_name="Admin",
            role=UserRole.SUPER_ADMIN,
        )
        db_session.add(admin)
        db_session.commit()
        
        # Login and test
        from app.core.security import create_access_token
        from datetime import timedelta
        
        token = create_access_token(str(admin.id), timedelta(hours=1))
        response = client.get(
            "/api/v1/admin/stats",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        assert "gyms" in response.json()


class TestAdminGymManagement:
    """Test gym management endpoints."""
    
    def test_list_gyms(self, client, db_session, super_admin_token):
        """List all gyms."""
        response = client.get(
            "/api/v1/admin/gyms",
            headers={"Authorization": f"Bearer {super_admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data


class TestAdminUserManagement:
    """Test user management endpoints."""
    
    def test_list_users(self, client, super_admin_token):
        """List all users."""
        response = client.get(
            "/api/v1/admin/users",
            headers={"Authorization": f"Bearer {super_admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
```

---

## Deployment Checklist

- [ ] Backend: Add UserRole.SUPER_ADMIN to enums.py
- [ ] Backend: Create require_super_admin dependency
- [ ] Backend: Create AdminService with all methods
- [ ] Backend: Create AdminRouter with endpoints
- [ ] Backend: Register router in main.py
- [ ] Backend: Add admin tests
- [ ] Frontend: Create AdminLayout with navigation
- [ ] Frontend: Create AdminDashboard component
- [ ] Frontend: Create GymsPage component
- [ ] Frontend: Add admin route to App.tsx
- [ ] Frontend: Update navbar to show admin link for super_admin only
- [ ] Database: Add super_admin role to test fixture
- [ ] Tests: Run pytest backend tests
- [ ] Tests: Run E2E tests for admin dashboard
- [ ] Deploy: Push to Render + Vercel
- [ ] Verify: Test admin panel on production

---

## Next: Create Super Admin Account

Once deployed, create super_admin account:

```python
# In backend terminal
python
>>> from app.core.database import get_db, engine
>>> from sqlalchemy.orm import sessionmaker
>>> from app.core.security import hash_password
>>> from app.models import User, Gym
>>> from app.models.enums import UserRole

>>> Session = sessionmaker(bind=engine)
>>> db = Session()

>>> gym = Gym(name="HQ", phone="0000000000")
>>> db.add(gym)
>>> db.commit()

>>> admin = User(
...   gym_id=gym.id,
...   email="admin@activehq.fit",
...   password_hash=hash_password("Admin@YourSecurePass123"),
...   full_name="Platform Admin",
...   role=UserRole.SUPER_ADMIN
... )
>>> db.add(admin)
>>> db.commit()
>>> print(f"Super admin created: {admin.id}")
```

Then login at `/login` with that account → redirects to `/admin/dashboard`.

