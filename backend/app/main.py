"""
ActiveHQ - Gym Management SaaS Platform
Main FastAPI application entry point.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    Runs startup and shutdown logic.
    """
    # Startup
    print(f"🚀 Starting {settings.app_name} v{settings.app_version}")
    print(f"   Environment: {settings.environment}")
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

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
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
    """Health check endpoint for monitoring."""
    return {"status": "healthy"}


# API Routers
from app.auth.router import router as auth_router
from app.gyms.router import router as gyms_router
from app.members.router import router as members_router
from app.plans.router import router as plans_router
from app.memberships.router import router as memberships_router
from app.payments.router import router as payments_router
from app.attendance.router import router as attendance_router
from app.reports.router import router as reports_router
from app.public.router import router as public_router

# Include all routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(gyms_router, prefix="/api/v1/gym", tags=["Gym Management"])
app.include_router(members_router, prefix="/api/v1/members", tags=["Members"])
app.include_router(plans_router, prefix="/api/v1/plans", tags=["Plans"])
app.include_router(memberships_router, prefix="/api/v1/memberships", tags=["Memberships"])
app.include_router(payments_router, prefix="/api/v1/payments", tags=["Payments"])
app.include_router(attendance_router, prefix="/api/v1/attendance", tags=["Attendance"])
app.include_router(reports_router, prefix="/api/v1/reports", tags=["Reports"])
app.include_router(public_router, prefix="/api/v1/public", tags=["Public"])
