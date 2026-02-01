# ActiveHQ

> The modern gym management platform built for Indian fitness businesses.

![ActiveHQ](https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80)

## Overview

ActiveHQ is a complete SaaS platform for gym and fitness center management. Built with a focus on Indian market needs — supporting Cash + UPI payments, WhatsApp notifications, and simple operations that work on any device.

### Key Features

- **Member Management** — Add, track, and manage gym members with ease
- **Membership Plans** — Flexible plans with custom durations and pricing
- **Payment Tracking** — Cash, UPI, and card payments with daily reconciliation
- **Attendance** — One-tap check-in with attendance reports
- **Renewal Automation** — WhatsApp reminders before membership expiry
- **Analytics Dashboard** — Real-time insights on revenue, attendance, and growth
- **Multi-tenant** — Each gym gets isolated data with role-based access

---

## Tech Stack

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **Database:** PostgreSQL with SQLAlchemy 2.0
- **Auth:** JWT with role-based access control
- **Migrations:** Alembic

### Frontend
- **Framework:** React 18 with TypeScript
- **Styling:** Tailwind CSS
- **State:** Zustand + React Query
- **Build:** Vite

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+

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

# Copy environment file
cp .env.example .env
# Edit .env with your database credentials

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

Frontend runs at: `http://localhost:5173`

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
│   │   ├── public/         # Public endpoints (demo requests)
│   │   ├── models/         # SQLAlchemy models
│   │   └── core/           # Config, security, database
│   ├── alembic/            # Database migrations
│   ├── scripts/            # Utility scripts
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── public/     # Marketing website
│   │   │   ├── auth/       # Login & Register
│   │   │   ├── dashboard/  # Main dashboard
│   │   │   ├── members/    # Member management
│   │   │   ├── payments/   # Payment pages
│   │   │   └── ...
│   │   ├── layouts/        # Auth & Dashboard layouts
│   │   ├── components/     # Reusable UI components
│   │   ├── services/       # API service layer
│   │   ├── store/          # Zustand state management
│   │   └── types/          # TypeScript definitions
│   └── package.json
│
└── README.md
```

---

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` — Register new gym
- `POST /api/v1/auth/login` — Login
- `POST /api/v1/auth/refresh` — Refresh token
- `GET /api/v1/auth/me` — Current user

### Members
- `GET /api/v1/members` — List members (with search & filters)
- `POST /api/v1/members` — Create member
- `GET /api/v1/members/{id}` — Get member details
- `PUT /api/v1/members/{id}` — Update member
- `DELETE /api/v1/members/{id}` — Delete member

### Plans
- `GET /api/v1/plans` — List plans
- `POST /api/v1/plans` — Create plan
- `PUT /api/v1/plans/{id}` — Update plan

### Memberships
- `GET /api/v1/memberships` — List memberships
- `POST /api/v1/memberships` — Create membership
- `PUT /api/v1/memberships/{id}` — Update membership

### Payments
- `GET /api/v1/payments` — List payments
- `POST /api/v1/payments` — Record payment
- `GET /api/v1/payments/summary` — Daily summary

### Attendance
- `POST /api/v1/attendance/check-in` — Check in member
- `POST /api/v1/attendance/check-out` — Check out member
- `GET /api/v1/attendance/today` — Today's attendance

### Reports
- `GET /api/v1/reports/dashboard` — Dashboard stats
- `GET /api/v1/reports/expiring` — Expiring memberships
- `GET /api/v1/reports/dues` — Members with dues

---

## Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/activehq

# Security
SECRET_KEY=your-super-secret-key-minimum-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# App
APP_NAME=ActiveHQ
APP_VERSION=1.0.0
ENVIRONMENT=development
DEBUG=true

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000
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
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables
5. After deploy, run migrations via Render Shell:
   ```bash
   alembic upgrade head
   python scripts/seed_data.py
   ```

### Frontend (Vercel)

1. Import GitHub repo
2. Set:
   - **Root Directory:** `frontend`
   - **Framework:** Vite
3. Add environment variable:
   - `VITE_API_URL` = your backend URL

---

## Screenshots

### Public Homepage
Premium marketing site with fitness imagery and elegant design.

### Dashboard
Clean, modern dashboard with stats, expiring members, and pending dues.

### Members List
Searchable, filterable member list with status badges.

### Login
Split-screen auth with gym imagery.

---

## Roadmap

- [ ] WhatsApp integration for notifications
- [ ] Bulk member import from Excel
- [ ] Personal training session tracking
- [ ] Expense management
- [ ] Multi-location support
- [ ] Mobile app (React Native)

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

- **Email:** hello@activehq.in
- **GitHub:** [@riyamoun](https://github.com/riyamoun)

---

Made with ❤️ for Indian gyms
