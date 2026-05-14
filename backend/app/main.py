"""
ActiveHQ - Gym Management SaaS Platform
Main FastAPI application entry point.
"""

from contextlib import asynccontextmanager

import sentry_sdk
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine
from app.core.rate_limit import limiter


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    Runs startup and shutdown logic.
    """
    # Startup
    print(f"🚀 Starting {settings.app_name} v{settings.app_version}")
    print(f"   Environment: {settings.environment}")
    if settings.sentry_dsn:
        sentry_sdk.init(
            dsn=settings.sentry_dsn,
            traces_sample_rate=settings.sentry_traces_sample_rate,
            environment=settings.environment,
        )
        print("   Sentry monitoring enabled")
    yield
    # Shutdown
    print(f"👋 Shutting down {settings.app_name}")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Multi-tenant gym management SaaS platform",
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,  # Disable docs in production
    redoc_url="/redoc" if settings.debug else None,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=settings.cors_allow_origin_regex or None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint - basic health check."""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "running",
    }


@app.get("/health")
async def health_check():
    """Liveness: API is up. Use for process managers."""
    return {"status": "healthy"}


@app.get("/health/ready")
async def readiness_check():
    """
    Readiness: API + DB are up. Returns 503 if DB unreachable.
    Use for load balancers / k8s readinessProbe.
    """
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception:
        raise HTTPException(status_code=503, detail="Database unavailable")
    return {"status": "ready"}


@app.get("/health/detailed")
async def detailed_health_check():
    """Detailed health for diagnostics (includes DB status)."""
    db_status = "healthy"
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception:
        db_status = "unhealthy"
    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "services": {"api": "healthy", "database": db_status},
    }


@app.get("/setup-database")
async def setup_database(setup_key: str = Query(default="")):
    """
    One-time database setup endpoint (development only).
    Creates tables and seeds demo data.
    
    SECURITY:
    - Only works in development or staging environment
    - Requires SETUP_DATABASE_KEY environment variable
    - Returns error if database already has data
    
    Usage: GET /setup-database?setup_key=YOUR_SECRET_KEY
    """
    from datetime import date, timedelta
    from decimal import Decimal
    import random
    
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    
    from app.core.config import settings
    from app.core.security import hash_password
    from app.core.base import Base
    from app.models import Gym, User, Member, Plan, Membership
    from app.models.enums import (
        SubscriptionStatus, BillingCycle, UserRole, Gender,
        MembershipStatus, PaymentMode
    )
    
    # ⚠️ Block in production
    if settings.environment == "production":
        raise HTTPException(
            status_code=403,
            detail="Database setup endpoint disabled in production"
        )
    
    # ⚠️ Require setup key
    if not settings.setup_database_key:
        raise HTTPException(
            status_code=403,
            detail="Setup endpoint disabled: SETUP_DATABASE_KEY not configured"
        )
    
    # ⚠️ Validate setup key
    if not setup_key:
        raise HTTPException(status_code=401, detail="setup_key parameter required")
    
    if setup_key != settings.setup_database_key:
        # Log failed attempts
        from app.core.logger import logger
        logger.warning(f"Failed setup-database attempt with invalid key from request")
        raise HTTPException(status_code=403, detail="Invalid setup key")

    try:
        engine = create_engine(settings.database_url_sqlalchemy, echo=False)
        
        # Create all tables
        Base.metadata.create_all(engine)
        
        Session = sessionmaker(bind=engine)
        db = Session()
        
        # Check if data exists - prevent re-seeding
        existing_gym = db.query(Gym).first()
        if existing_gym:
            db.close()
            from app.core.logger import logger
            logger.info(f"Setup endpoint called but database already initialized")
            return {"status": "already_setup", "gym": existing_gym.name}
        
        # Create Gym
        gym = Gym(
            name="FitZone Premium Gym",
            slug="fitzone-premium-gym",
            owner_name="Rajesh Kumar",
            email="contact@fitzonegym.com",
            phone="9876543210",
            address="123, MG Road, Koramangala",
            city="Bangalore",
            state="Karnataka",
            pincode="560034",
            subscription_status=SubscriptionStatus.ACTIVE,
            subscription_start=date.today() - timedelta(days=30),
            subscription_end=date.today() + timedelta(days=335),
            setup_fee_paid=True,
            billing_cycle=BillingCycle.YEARLY,
            settings={"timezone": "Asia/Kolkata", "currency": "INR"},
            is_active=True,
        )
        db.add(gym)
        db.flush()
        
        # Create Owner
        owner = User(
            gym_id=gym.id,
            email="owner@fitzonegym.com",
            password_hash=hash_password("Owner@123"),
            name="Rajesh Kumar",
            phone="9876543210",
            role=UserRole.OWNER,
            is_active=True,
        )
        db.add(owner)
        db.flush()
        
        # Create Plans
        plans_data = [
            ("Monthly", "Basic monthly membership", 30, 1500),
            ("Quarterly", "3 months membership", 90, 4000),
            ("Half Yearly", "6 months membership", 180, 7500),
            ("Yearly", "Annual membership", 365, 14000),
        ]
        
        plans = []
        for name, desc, days, price in plans_data:
            plan = Plan(
                gym_id=gym.id,
                name=name,
                description=desc,
                duration_days=days,
                price=Decimal(price),
                is_active=True,
            )
            db.add(plan)
            plans.append(plan)
        db.flush()
        
        # Create sample members
        names = ["Rahul Sharma", "Priya Patel", "Amit Singh", "Neha Gupta", "Vikram Reddy"]
        members = []
        for i, name in enumerate(names):
            member = Member(
                gym_id=gym.id,
                name=name,
                phone=f"98765{str(i).zfill(5)}",
                gender=Gender.MALE if i % 2 == 0 else Gender.FEMALE,
                joined_date=date.today() - timedelta(days=random.randint(10, 90)),
                member_code=f"FZ{str(i+1).zfill(4)}",
                is_active=True,
            )
            db.add(member)
            members.append(member)
        db.flush()
        
        # Create memberships
        for member in members:
            plan = random.choice(plans)
            start = member.joined_date
            membership = Membership(
                gym_id=gym.id,
                member_id=member.id,
                plan_id=plan.id,
                start_date=start,
                end_date=start + timedelta(days=plan.duration_days),
                amount_total=plan.price,
                amount_paid=plan.price,
                status=MembershipStatus.ACTIVE,
                created_by=owner.id,
            )
            db.add(membership)
        
        db.commit()
        db.close()

        return {
            "status": "success",
            "message": "Database setup complete. Sign in with the seeded owner email; password is the one provided in your environment docs.",
            "login": {"email": "owner@fitzonegym.com"},
        }

    except Exception as e:
        from app.core.logger import logger
        logger.error(f"setup_database_failed: {e}", exc_info=True)
        try:
            db.rollback()  # type: ignore[name-defined]
            db.close()  # type: ignore[name-defined]
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database setup failed. Check server logs.",
        )


# API Routers
from app.auth.router import router as auth_router
from app.admin.router import router as admin_router
from app.gyms.router import router as gyms_router
from app.members.router import router as members_router
from app.plans.router import router as plans_router
from app.memberships.router import router as memberships_router
from app.payments.router import router as payments_router
from app.attendance.router import router as attendance_router
from app.reports.router import router as reports_router
from app.public.router import router as public_router
from app.biometric.router import router as biometric_router
from app.automation.router import router as automation_router
from app.notifications.router import router as notifications_router
from app.migration.router import router as migration_router
from app.member_portal.auth_router import router as member_auth_router
from app.member_portal.api_router import router as member_api_router
from app.coach.router import router as coach_router

# Include all routers
app.include_router(admin_router, tags=["Admin"])
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(gyms_router, prefix="/api/v1/gym", tags=["Gym Management"])
app.include_router(members_router, prefix="/api/v1/members", tags=["Members"])
app.include_router(plans_router, prefix="/api/v1/plans", tags=["Plans"])
app.include_router(memberships_router, prefix="/api/v1/memberships", tags=["Memberships"])
app.include_router(payments_router, prefix="/api/v1/payments", tags=["Payments"])
app.include_router(attendance_router, prefix="/api/v1/attendance", tags=["Attendance"])
app.include_router(reports_router, prefix="/api/v1/reports", tags=["Reports"])
app.include_router(public_router, prefix="/api/v1/public", tags=["Public"])
app.include_router(biometric_router, prefix="/api/v1/biometric", tags=["Biometric"])
app.include_router(automation_router, prefix="/api/v1/automation", tags=["Automation"])
app.include_router(notifications_router, prefix="/api/v1", tags=["Notifications"])
app.include_router(migration_router, prefix="/api/v1/migration", tags=["Migration"])
# Member portal — separate top-level prefix so the surface is easy to spot
app.include_router(member_auth_router, prefix="/api/m/auth", tags=["Member Portal Auth"])
app.include_router(member_api_router, prefix="/api/m", tags=["Member Portal"])
app.include_router(coach_router, prefix="/api/coach", tags=["AI Coach"])
