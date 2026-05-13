# ActiveHQ

> The modern gym management platform built for Indian fitness businesses.

![ActiveHQ](https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80)

## Overview

ActiveHQ is a complete SaaS platform for gym and fitness center management. Built with a focus on Indian market needs — supporting Cash + UPI payments, WhatsApp notifications, and simple operations that work on any device.

### Key Features

- **Member Management** — Add, track, and manage gym members with search & status filters
- **Membership Plans** — Flexible plans with custom durations and pricing
- **Memberships** — Create, renew, pause, resume, and cancel memberships
- **Payment Tracking** — Cash, UPI, and card payments with daily/weekly/monthly collection reports
- **Attendance** — One-tap check-in/out with daily summaries and member history
- **Biometric Integration** — Connect fingerprint devices for automated attendance
- **Renewal Automation** — Campaign-based WhatsApp/SMS/email reminders
- **Analytics Dashboard** — Real-time insights: revenue opportunity, action center, activity feed
- **Data Import** — CSV import for migrating from old systems (members, plans, memberships, payments, attendance)
- **Multi-tenant** — Each gym gets isolated data with role-based access (Owner, Manager, Staff)
- **Super Admin** — Platform-level admin API for managing all gyms

---

## Tech Stack

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **Database:** PostgreSQL 16 with SQLAlchemy 2.0
- **Auth:** JWT (access + refresh tokens) with role-based access control
- **Migrations:** Alembic
- **Rate Limiting:** SlowAPI
- **Monitoring:** Optional Sentry integration

### Frontend
- **Framework:** React 18 with TypeScript
- **Styling:** Tailwind CSS
- **State:** Zustand (auth) + TanStack React Query (server state)
- **Build:** Vite 5
- **Icons:** Lucide React
- **Testing:** Playwright (e2e)

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+ (or Docker Desktop for the optional database below)

### 0. (Optional) PostgreSQL with Docker

From the **repository root** (matches `backend/.env.example`):

```bash
docker compose up -d
```

Wait until the container is healthy, then continue with the backend. To stop: `docker compose down` (add `-v` to drop data).

### 1. Clone the repository

```bash
git clone https://github.com/riyamoun/ActiveHQ.git
cd ActiveHQ
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
.\venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file (Windows: copy .env.example .env)
cp .env.example .env
# Edit .env if your database user/password/db name differ from .env.example

# Run migrations
alembic upgrade head

# Seed demo data
python scripts/seed_data.py

# Start server
uvicorn app.main:app --reload
```

Backend runs at: `http://localhost:8000`
API Docs: `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: `http://localhost:3002` (matches Playwright + CI; override with `npm run dev -- --port 5173` if needed)

Leave **`VITE_API_URL` unset** for local dev so the Vite dev server proxies `/api` to `http://localhost:8000` (see `frontend/vite.config.ts`). Set it only when pointing at a remote API.

**Order to run:** backend (`uvicorn` on :8000) first, then frontend (`npm run dev` on :3002). Sign in at `/login` using the seeded demo users below.

---

## Demo Credentials

After running the seed script:

| Role | Email | Password |
|------|-------|----------|
| Owner | `owner@fitzonegym.com` | `Owner@123` |
| Manager | `manager@fitzonegym.com` | `Staff@123` |
| Staff | `staff1@fitzonegym.com` | `Staff@123` |

---

## Project Structure

```
ActiveHQ/
├── backend/
│   ├── app/
│   │   ├── auth/           # Authentication & authorization
│   │   ├── members/        # Member CRUD operations
│   │   ├── memberships/    # Membership management
│   │   ├── payments/       # Payment tracking
│   │   ├── plans/          # Membership plans
│   │   ├── attendance/     # Check-in/check-out
│   │   ├── reports/        # Analytics & reports
│   │   ├── gyms/           # Gym settings
│   │   ├── admin/          # Super admin platform management
│   │   ├── biometric/      # Biometric device integration
│   │   ├── automation/     # Campaign & notification automation
│   │   ├── notifications/  # SMS/Email/WhatsApp notifications
│   │   ├── migration/      # Bulk data import from old systems
│   │   ├── public/         # Public endpoints (demo requests)
│   │   ├── models/         # SQLAlchemy models
│   │   └── core/           # Config, security, database
│   ├── alembic/            # Database migrations
│   ├── scripts/            # Utility scripts (seed, biometric agent)
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── public/     # Marketing website (home, features, stories, contact, privacy, terms)
│   │   │   ├── auth/       # Login & Register
│   │   │   ├── dashboard/  # Main dashboard with action center
│   │   │   ├── members/    # Member management (list, detail, add)
│   │   │   ├── plans/      # Plan management
│   │   │   ├── memberships/# Membership tracking
│   │   │   ├── payments/   # Payment pages
│   │   │   ├── attendance/ # Attendance tracking
│   │   │   ├── reports/    # Analytics reports
│   │   │   ├── settings/   # Gym settings & data import
│   │   │   └── landing/    # Internal preview landing
│   │   ├── layouts/        # Auth & Dashboard layouts
│   │   ├── components/     # Reusable UI components
│   │   ├── services/       # API service layer
│   │   ├── store/          # Zustand auth state
│   │   ├── lib/            # Utilities (API client, validation, analytics)
│   │   └── types/          # TypeScript definitions
│   ├── tests/              # Playwright e2e tests
│   └── package.json
│
├── docker-compose.yml      # PostgreSQL for local dev
└── README.md
```

---

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` — Register new gym + owner
- `POST /api/v1/auth/login` — Login (email + password)
- `POST /api/v1/auth/refresh` — Refresh access token
- `POST /api/v1/auth/logout` — Revoke refresh token
- `GET /api/v1/auth/me` — Current user
- `PUT /api/v1/auth/me/password` — Change password

### Staff Management
- `GET /api/v1/auth/users` — List staff (Manager+)
- `POST /api/v1/auth/users` — Create staff (Owner)
- `PUT /api/v1/auth/users/{id}` — Update staff (Owner)
- `DELETE /api/v1/auth/users/{id}` — Deactivate staff (Owner)

### Gym
- `GET /api/v1/gym/current` — Current gym profile
- `PUT /api/v1/gym/current` — Update gym (Owner)
- `PUT /api/v1/gym/current/settings` — Update settings (Owner)

### Members
- `GET /api/v1/members` — List members (search, filter by status: active/expiring/expired)
- `POST /api/v1/members` — Create member (Manager+)
- `GET /api/v1/members/{id}` — Member detail with membership info
- `PUT /api/v1/members/{id}` — Update member (Manager+)
- `DELETE /api/v1/members/{id}` — Deactivate member (Owner)
- `POST /api/v1/members/{id}/reactivate` — Reactivate member (Owner)
- `GET /api/v1/members/expiring` — Members expiring within N days
- `GET /api/v1/members/with-dues` — Members with pending dues

### Plans
- `GET /api/v1/plans` — List all plans
- `GET /api/v1/plans/active` — Active plans only
- `POST /api/v1/plans` — Create plan (Owner)
- `PUT /api/v1/plans/{id}` — Update plan (Owner)
- `DELETE /api/v1/plans/{id}` — Deactivate plan (Owner)

### Memberships
- `GET /api/v1/memberships` — List memberships
- `POST /api/v1/memberships` — Create membership
- `POST /api/v1/memberships/member/{id}/renew` — Renew membership
- `POST /api/v1/memberships/{id}/pause` — Pause
- `POST /api/v1/memberships/{id}/resume` — Resume
- `POST /api/v1/memberships/{id}/cancel` — Cancel

### Payments
- `GET /api/v1/payments` — List payments
- `POST /api/v1/payments` — Record payment
- `GET /api/v1/payments/daily` — Daily collection summary
- `GET /api/v1/payments/collection-range` — Collection by date range

### Attendance
- `POST /api/v1/attendance/check-in` — Check in member
- `POST /api/v1/attendance/check-out/{member_id}` — Check out
- `GET /api/v1/attendance/today` — Today's attendance
- `GET /api/v1/attendance/daily-summary` — Daily summary stats
- `GET /api/v1/attendance/currently-in` — Currently in gym

### Reports
- `GET /api/v1/reports/dashboard` — Dashboard stats
- `GET /api/v1/reports/action-center` — Expiring + dues + inactive counts
- `GET /api/v1/reports/revenue-opportunity` — Revenue opportunity analysis
- `GET /api/v1/reports/activity-feed` — Recent activity
- `GET /api/v1/reports/expiring-members` — Expiring memberships
- `GET /api/v1/reports/members-with-dues` — Members with dues
- `GET /api/v1/reports/inactive-members` — Inactive members
- `GET /api/v1/reports/collection` — Collection reports (today/this-week/this-month)

### Biometric
- `GET /api/v1/biometric/devices` — List devices (Manager+)
- `POST /api/v1/biometric/devices` — Register device (Manager+)
- `POST /api/v1/biometric/devices/{id}/token` — Generate ingest token
- `POST /api/v1/biometric/events/ingest` — Push events (JWT)
- `POST /api/v1/biometric/events/ingest-device` — Push events (device token)

### Automation
- `GET /api/v1/automation/campaigns` — List campaigns (Manager+)
- `POST /api/v1/automation/campaigns` — Create campaign
- `GET /api/v1/automation/reminder-list` — Members due for reminders

### Notifications
- `POST /api/v1/notifications/sms` — Send SMS (Manager+)
- `POST /api/v1/notifications/email` — Send email
- `POST /api/v1/notifications/whatsapp` — Send WhatsApp
- `GET /api/v1/notifications/history` — Notification history
- `GET /api/v1/notifications/stats` — Delivery stats

### Data Import (Migration)
- `POST /api/v1/migration/members` — Bulk import members (Manager+)
- `POST /api/v1/migration/plans` — Bulk import plans
- `POST /api/v1/migration/memberships` — Bulk import memberships
- `POST /api/v1/migration/payments` — Bulk import payments
- `POST /api/v1/migration/attendance` — Bulk import attendance
- `POST /api/v1/migration/reconciliation` — Validate imported data

### Admin (Super Admin only)
- `GET /api/v1/admin/stats` — Platform metrics
- `GET /api/v1/admin/gyms` — List all gyms
- `PATCH /api/v1/admin/gyms/{id}/toggle` — Enable/disable gym
- `GET /api/v1/admin/demo-requests` — Sales leads

### Public
- `POST /api/v1/public/demo-request` — Submit demo request
- `GET /api/v1/public/seed-demo` — Seed demo data (empty DB only)

---

## Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/activehq

# JWT Security
JWT_SECRET_KEY=your-super-secret-key-minimum-32-characters
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# App
APP_NAME=ActiveHQ
APP_VERSION=1.0.0
ENVIRONMENT=development
DEBUG=true

# CORS (comma-separated)
CORS_ORIGINS_STR=http://localhost:3002,http://localhost:5173

# Dev setup (for /setup-database endpoint)
SETUP_DATABASE_KEY=your-setup-key

# Optional: Notifications
# PICKYASSIST_API_TOKEN=
# SMTP_HOST=
# SMTP_PORT=587
# SMTP_USER=
# SMTP_PASSWORD=
# SMTP_FROM=

# Optional: Monitoring
# SENTRY_DSN=

# Optional: Automation cron
# CRON_SECRET=your-cron-secret
```

### Frontend (.env)

```env
# Leave unset for local dev (Vite proxy handles it)
# Set only for production/staging:
# VITE_API_URL=https://your-backend-url.com

# Optional:
# VITE_SENTRY_DSN=
```

---

## Deployment

### Database (Supabase / Neon / Railway)

1. Create a PostgreSQL database
2. Copy the connection string
3. Set as `DATABASE_URL` in backend environment

### Backend (Render)

1. Create new Web Service
2. Connect GitHub repo
3. Set:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables
5. After first deploy, seed via Render Shell:
   ```bash
   python scripts/seed_data.py
   ```

### Frontend (Vercel)

1. Import GitHub repo
2. Set:
   - **Root Directory:** `frontend`
   - **Framework:** Vite
3. Add environment variable:
   - `VITE_API_URL` = your backend URL (e.g. `https://activehq-api.onrender.com`)

---

## Roadmap

- [ ] Personal training session tracking
- [ ] Expense management
- [ ] Multi-location support
- [ ] Mobile app (React Native)
- [ ] Bulk Excel import (CSV import available now)

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Contact

- **Email:** info@activehq.fit
- **GitHub:** [@riyamoun](https://github.com/riyamoun)

---

Made with care for Indian gyms
