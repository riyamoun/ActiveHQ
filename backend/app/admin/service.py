"""
Admin service for platform operations.
Handles gym management, user administration, analytics, and platform metrics.
"""

import uuid
from datetime import datetime, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Gym, User, Member, Membership, Payment, Attendance
from app.models.enums import UserRole


class AdminService:
    """Service class for admin operations (super_admin only)."""

    def __init__(self, db: Session):
        self.db = db

    # ============= GYMS =============

    def list_all_gyms(self, page: int = 1, page_size: int = 20):
        """List all gyms with subscription status and activity metrics."""
        query = self.db.query(Gym).order_by(Gym.created_at.desc())
        
        total = query.count()
        gyms = query.offset((page - 1) * page_size).limit(page_size).all()
        
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
                    "members_count": self._count_gym_members(gym.id),
                    "revenue_this_month": self._get_gym_revenue(gym.id, days=30),
                    "last_activity": self._get_gym_last_activity(gym.id),
                    "created_at": gym.created_at.isoformat() if gym.created_at else None,
                }
                for gym in gyms
            ],
            "page": page,
            "page_size": page_size,
            "total": total,
        }

    def get_gym_detail(self, gym_id: uuid.UUID):
        """Get detailed information about a specific gym."""
        gym = self.db.query(Gym).filter(Gym.id == gym_id).first()
        if not gym:
            raise ValueError("Gym not found")
        
        members = self.db.query(Member).filter(Member.gym_id == gym_id).all()
        active_members = sum(1 for m in members if m.is_active)
        
        # Get users for this gym
        users = self.db.query(User).filter(User.gym_id == gym_id).all()
        
        return {
            "id": gym.id,
            "name": gym.name,
            "email": gym.email,
            "phone": gym.phone,
            "address": gym.address,
            "city": gym.city,
            "state": gym.state,
            "subscription_status": gym.subscription_status,
            "subscription_end": gym.subscription_end.isoformat() if gym.subscription_end else None,
            "is_active": gym.is_active,
            "total_members": len(members),
            "active_members": active_members,
            "revenue_all_time": self._get_gym_revenue(gym_id),
            "revenue_this_month": self._get_gym_revenue(gym_id, days=30),
            "created_at": gym.created_at.isoformat() if gym.created_at else None,
            "users": [
                {
                    "id": str(user.id),
                    "email": user.email,
                    "name": user.name,
                    "role": user.role,
                    "is_active": user.is_active,
                }
                for user in users
            ],
        }

    def toggle_gym_status(self, gym_id: uuid.UUID, is_active: bool):
        """Enable/disable entire gym (blocks all access)."""
        gym = self.db.query(Gym).filter(Gym.id == gym_id).first()
        if not gym:
            raise ValueError("Gym not found")
        
        gym.is_active = is_active
        self.db.commit()
        
        from app.core.logger import log_info
        log_info(
            f"Gym {gym.name} status changed to {is_active}",
            gym_id=gym_id,
            is_active=is_active,
        )
        
        return {
            "id": gym.id,
            "name": gym.name,
            "is_active": gym.is_active,
        }

    # ============= USERS =============

    def list_all_users(self, role: str = None, page: int = 1, page_size: int = 20):
        """List all users across all gyms."""
        query = self.db.query(User)
        
        if role:
            query = query.filter(User.role == role)
        
        query = query.order_by(User.created_at.desc())
        total = query.count()
        users = query.offset((page - 1) * page_size).limit(page_size).all()
        
        return {
            "items": [
                {
                    "id": str(user.id),
                    "email": user.email,
                    "name": user.name,
                    "gym_id": user.gym_id,
                    "gym_name": self._get_gym_name(user.gym_id),
                    "role": user.role,
                    "is_active": user.is_active,
                    "created_at": user.created_at.isoformat() if user.created_at else None,
                    "last_login": user.last_login.isoformat() if hasattr(user, "last_login") and user.last_login else None,
                }
                for user in users
            ],
            "page": page,
            "page_size": page_size,
            "total": total,
        }

    def toggle_user_status(self, user_id: uuid.UUID, is_active: bool):
        """Enable/disable user access."""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        
        user.is_active = is_active
        self.db.commit()
        
        from app.core.logger import log_info
        log_info(
            f"User {user.email} status changed to {is_active}",
            user_id=str(user.id),
            is_active=is_active,
        )
        
        return {
            "id": str(user.id),
            "email": user.email,
            "is_active": user.is_active,
        }

    # ============= ANALYTICS =============

    def get_platform_stats(self):
        """Get platform-wide metrics for dashboard."""
        # Gym counts
        total_gyms = self.db.query(func.count(Gym.id)).scalar() or 0
        active_gyms = self.db.query(func.count(Gym.id)).filter(
            Gym.is_active == True  # noqa: E712
        ).scalar() or 0
        
        # Member counts
        total_members = self.db.query(func.count(Member.id)).scalar() or 0
        active_members = self.db.query(func.count(Member.id)).filter(
            Member.is_active == True  # noqa: E712
        ).scalar() or 0
        
        # User counts by role
        total_users = self.db.query(func.count(User.id)).scalar() or 0
        total_owners = self.db.query(func.count(User.id)).filter(
            User.role == UserRole.OWNER
        ).scalar() or 0
        total_managers = self.db.query(func.count(User.id)).filter(
            User.role == UserRole.MANAGER
        ).scalar() or 0
        total_staff = self.db.query(func.count(User.id)).filter(
            User.role == UserRole.STAFF
        ).scalar() or 0
        
        # Revenue this month (all gyms)
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
                "managers": total_managers,
                "staff": total_staff,
                "super_admins": self.db.query(func.count(User.id)).filter(
                    User.role == UserRole.SUPER_ADMIN
                ).scalar() or 0,
            },
            "revenue": {
                "this_month": float(revenue),
            },
        }

    # ============= DEMO REQUESTS =============

    def list_demo_requests(self, page: int = 1, page_size: int = 20):
        """List all demo requests (sales leads)."""
        from app.models.demo_request import DemoRequest
        
        query = self.db.query(DemoRequest).order_by(
            DemoRequest.created_at.desc()
        )
        total = query.count()
        requests = query.offset((page - 1) * page_size).limit(page_size).all()
        
        return {
            "items": [
                {
                    "id": req.id,
                    "name": req.name,
                    "gym_name": req.gym_name,
                    "phone": req.phone,
                    "city": req.city,
                    "status": getattr(req, "status", "pending"),
                    "created_at": req.created_at.isoformat() if req.created_at else None,
                }
                for req in requests
            ],
            "page": page,
            "page_size": page_size,
            "total": total,
        }

    # ============= HELPERS =============

    def _count_gym_members(self, gym_id: uuid.UUID) -> int:
        """Count total members in a gym."""
        return self.db.query(func.count(Member.id)).filter(
            Member.gym_id == gym_id
        ).scalar() or 0

    def _get_gym_revenue(self, gym_id: uuid.UUID, days: int = None) -> float:
        """Calculate total revenue for a gym."""
        query = self.db.query(func.sum(Payment.amount)).filter(
            Payment.membership_id.in_(
                self.db.query(Membership.id).filter(
                    Membership.gym_id == gym_id
                )
            )
        )
        
        if days:
            start_date = datetime.now().date() - timedelta(days=days)
            query = query.filter(Payment.payment_date >= start_date)
        
        total = query.scalar() or 0
        return float(total)

    def _get_gym_last_activity(self, gym_id: uuid.UUID):
        """Get the most recent activity timestamp for a gym."""
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
        if dates:
            last = max(dates)
            return last.isoformat() if hasattr(last, "isoformat") else str(last)
        return None

    def _get_gym_name(self, gym_id: int) -> str:
        """Get gym name by ID."""
        gym = self.db.query(Gym).filter(Gym.id == gym_id).first()
        return gym.name if gym else "Unknown"
