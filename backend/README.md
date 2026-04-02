# ActiveHQ Backend

Multi-tenant gym management SaaS platform built with FastAPI, SQLAlchemy 2.0, and PostgreSQL.

## Tech Stack

- **Framework**: FastAPI
- **Database**: PostgreSQL 16
- **ORM**: SQLAlchemy 2.0
- **Migrations**: Alembic
- **Auth**: JWT (python-jose) with bcrypt passwords and refresh token rotation
- **Rate Limiting**: SlowAPI
- **Monitoring**: Optional Sentry integration
- **Python**: 3.11+

## Project Structure

```
backend/
├── app/
│   ├── core/           # Config, database, security, base classes
│   ├── models/         # SQLAlchemy models (all tables)
│   ├── auth/           # Authentication & staff management
│   ├── admin/          # Super admin platform management
│   ├── gyms/           # Gym profile & settings
│   ├── members/        # Member CRUD & search
│   ├── plans/          # Membership plan management
│   ├── memberships/    # Membership lifecycle (create/renew/pause/cancel)
│   ├── payments/       # Payment recording & collection reports
│   ├── attendance/     # Check-in/out & daily summaries
│   ├── reports/        # Dashboard, action center, revenue analytics
│   ├── biometric/      # Fingerprint device integration
│   ├── automation/     # Campaign-based messaging automation
│   ├── notifications/  # SMS/Email/WhatsApp notification dispatch
│   ├── migration/      # Bulk CSV data import from old systems
│   ├── public/         # Public endpoints (demo request, seed)
│   ├── services/       # Shared services (messaging, audit)
│   └── main.py         # FastAPI app entry point
├── alembic/            # Database migrations
├── scripts/            # Seed data, biometric agent
├── tests/              # Pytest test suite
├── requirements.txt
└── .env.example
```

## Setup

```bash
cd backend
python -m venv venv

# Activate (Windows / Mac-Linux)
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux

pip install -r requirements.txt
cp .env.example .env         # Edit with your DB credentials

alembic upgrade head         # Run all migrations
python scripts/seed_data.py  # Seed demo data

uvicorn app.main:app --reload --port 8000
```

API: http://localhost:8000 | Docs: http://localhost:8000/docs

## Multi-Tenancy

Every table (except `gyms` and `demo_requests`) is scoped by `gym_id`. All queries **must** filter by `gym_id` to ensure data isolation.

## Models

| Model | Description |
|-------|-------------|
| Gym | Tenant — represents a gym business |
| User | Staff who login (Owner, Manager, Staff, Super Admin) |
| Member | Gym customers (do not login) |
| Plan | Membership plans with duration & pricing |
| Membership | Member's subscription to a plan (with lifecycle) |
| Payment | Payment records (Cash, UPI, Card, Bank Transfer) |
| Attendance | Check-in/check-out logs |
| Notification | Notification history (WhatsApp/SMS/Email) |
| BiometricDevice | Fingerprint/face device registry |
| BiometricEvent | Raw biometric event logs |
| AutomationCampaign | Campaign templates for automated messaging |
| CampaignDeliveryLog | Delivery tracking for campaigns |
| RefreshToken | JWT refresh token storage for revocation |
| AuditLog | Action audit trail per gym |
| DemoRequest | Sales leads from the marketing site |
| DeviceUserMapping | Maps biometric device users to members |

## Development Commands

```bash
uvicorn app.main:app --reload                      # Dev server
alembic revision --autogenerate -m "description"   # New migration
alembic upgrade head                               # Apply migrations
alembic downgrade -1                               # Rollback one
alembic history                                    # View history
pytest                                             # Run tests
```
