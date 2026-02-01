# ActiveHQ Backend

Multi-tenant gym management SaaS platform built with FastAPI, SQLAlchemy 2.0, and PostgreSQL.

## Tech Stack

- **Framework**: FastAPI
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy 2.0 (async-ready)
- **Migrations**: Alembic
- **Auth**: JWT with passlib/bcrypt
- **Python**: 3.11+

## Project Structure

```
backend/
├── app/
│   ├── core/           # Core configuration, database, base classes
│   ├── models/         # SQLAlchemy models
│   ├── auth/           # Authentication module (coming)
│   ├── gyms/           # Gym management (coming)
│   ├── members/        # Member management (coming)
│   ├── plans/          # Membership plans (coming)
│   ├── payments/       # Payment tracking (coming)
│   ├── attendance/     # Attendance tracking (coming)
│   ├── reports/        # Reporting (coming)
│   └── main.py         # FastAPI app entry point
├── alembic/            # Database migrations
├── requirements.txt
└── .env.example
```

## Setup

### 1. Create Virtual Environment

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your database credentials
```

### 4. Setup PostgreSQL Database

```bash
# Create database (using psql or pgAdmin)
createdb activehq

# Or using psql
psql -U postgres -c "CREATE DATABASE activehq;"
```

### 5. Run Migrations

```bash
# Generate initial migration
alembic revision --autogenerate -m "initial_schema"

# Apply migrations
alembic upgrade head
```

### 6. Run Development Server

```bash
uvicorn app.main:app --reload --port 8000
```

API will be available at:
- http://localhost:8000
- Swagger docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Multi-Tenancy

This is a multi-tenant application. Every table (except `gyms`) is scoped by `gym_id`.

**Critical Rule**: All queries MUST filter by `gym_id` to ensure data isolation between gyms.

## Models

| Model | Description |
|-------|-------------|
| Gym | Tenant - represents a gym business |
| User | Staff who login (Owner, Manager, Staff) |
| Member | Gym customers (do not login) |
| Plan | Membership plans |
| Membership | Member's subscription to a plan |
| Payment | Payment records |
| Attendance | Check-in/check-out logs |
| Notification | Notification history (WhatsApp/SMS/Email) |

## Development Commands

```bash
# Run server with auto-reload
uvicorn app.main:app --reload

# Generate migration after model changes
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history
```
