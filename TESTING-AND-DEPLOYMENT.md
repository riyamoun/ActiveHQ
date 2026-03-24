# ActiveHQ — Testing & Deployment Quick Reference

## 🧪 Running Tests

### Backend Unit Tests (Python)

```bash
cd backend

# Install test dependencies (already in requirements.txt)
pip install -r requirements.txt

# Run all tests
pytest -v

# Run specific test file
pytest tests/test_auth.py -v

# Run specific test
pytest tests/test_auth.py::TestAuthLogin::test_login_success -v

# Run with coverage
pytest --cov=app tests/

# Run tests matching a pattern
pytest tests/ -k "login" -v
```

**Output:** Tests should pass in < 10 seconds

### Frontend E2E Tests (Playwright)

```bash
cd frontend

# Install dependencies
npm install

# Run E2E tests
npm run test:e2e

# Run specific test file
npx playwright test tests/e2e-critical-flows.spec.ts

# Run in headed mode (watch test execution)
npx playwright test --headed

# Debug mode (pause on each action)
npx playwright test --debug

# Generate HTML report
npx playwright test --reporter=html
open playwright-report/index.html
```

**Prerequisite:** Frontend must be running (`npm run dev` in another terminal)

### Frontend Smoke Tests

```bash
cd frontend

# Run public site smoke tests
npx playwright test tests/public-smoke.spec.ts
```

---

## 🚀 Local Development

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Mac/Linux
# or
venv\Scripts\activate  # Windows

### Observability (Production)

- Set up Sentry + Render alerts using:
  - `docs/OBSERVABILITY-ALERTS.md`

# Install dependencies
pip install -r requirements.txt

# Copy example env
cp .env.example .env

# Edit .env with your settings
nano .env

# Run migrations
alembic upgrade head

# Seed demo data
python scripts/seed_data.py

# Start server
uvicorn app.main:app --reload

# Server runs at: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# Frontend runs at: http://localhost:5173
```

---

## 🐳 Docker & Render Deployment

### Local Docker Test

```bash
# Build image
docker build -t activehq-api ./backend

# Run container
docker run -p 8000:8000 \
  -e DATABASE_URL="postgresql+psycopg://user:pass@host:5432/activehq" \
  -e JWT_SECRET_KEY="your-secret-key" \
  -e ENVIRONMENT="development" \
  activehq-api

# Container will:
# 1. Run: alembic upgrade head
# 2. Start: Gunicorn + Uvicorn servers
# 3. Listen on: 0.0.0.0:8000
```

### Deploy to Render

1. **Connect GitHub Repo to Render**
   - Create new service or blueprint
   - Select repo: ActiveHQ
   - Select branch: main (or your branch)

2. **Render will:**
   - Read `render.yaml`
   - Build Docker image using `backend/Dockerfile`
   - entrypoint.sh runs migrations automatically
   - Start Gunicorn server

3. **Verify Deployment**
   ```bash
   # Check health
   curl https://activehq-api.onrender.com/health
   
   # Check readiness (includes DB)
   curl https://activehq-api.onrender.com/health/ready
   
   # Check logs in Render dashboard
   # Should see: "🗄️  Running Alembic migrations..."
   #           "✅ Migrations complete. Starting Gunicorn server..."
   ```

4. **Post-Deployment Checklist**
   - [ ] API is responding at health endpoint
   - [ ] Database migrations completed (check logs)
   - [ ] CORS_ORIGINS_STR is set to your Vercel frontend URL
   - [ ] JWT_SECRET_KEY is generated (set in Render)
   - [ ] Check Sentry dashboard for errors

---

## 🔍 Debugging & Troubleshooting

### Backend Tests Fail

```bash
# Check database connection
cd backend
python -c "from app.core.database import engine; engine.connect()"

# Check imports
python -c "from app.main import app; print('OK')"

# Run single test with verbose output
pytest tests/test_auth.py::TestAuthLogin::test_login_success -vv -s
```

### Frontend E2E Tests Fail

```bash
# Check frontend runs
npm run dev
# In another terminal:
npx playwright test --headed  # Watch the browser

# Check test timeout (increase if slow)
npx playwright test --timeout=30000

# Check browser installed
npx playwright install chromium
```

### Database Migrations Fail

```bash
# Check Alembic status
alembic current  # Show current revision
alembic history  # Show all migrations

# Check migration file syntax
cd alembic/versions && ls -la

# Rollback last migration
alembic downgrade -1

# Upgrade to latest
alembic upgrade head
```

### API Returns 503 (Database Unavailable)

```bash
# Check DB connection string
# Test manually:
psql $DATABASE_URL -c "SELECT 1"

# Check Render DB is running
# Check CORS if frontend gets 401/403
```

---

## 📊 Monitoring & Logs

### Local Development Logging

```bash
# Backend logs appear in terminal
# Look for:
# - 🚀 Starting ActiveHQ
# - Sentry monitoring enabled (if configured)
# - 👋 Shutting down

# Check Sentry integration
curl http://localhost:8000/docs  # swagger
# Trigger an error and check Sentry dashboard
```

### Production Logging (Render)

```bash
# In Render Dashboard:
1. Go to service: activehq-api
2. Click "Logs"
3. Search for:
   - "Alembic migrations" (deployment start)
   - "Starting Gunicorn" (server started)
   - Any ERROR or CRITICAL logs
4. Filter by date/time if needed
```

### Sentry Error Tracking

```bash
# Set SENTRY_DSN in Render env vars
# Errors are automatically tracked

# Check dashboard:
# https://sentry.io/organizations/your-org/issues/
```

---

## 🔐 Environment Variables

### Backend (.env or Render)

```bash
# Database
DATABASE_URL=postgresql+psycopg://user:pass@host:5432/activehq

# Authentication
JWT_SECRET_KEY=use-a-strong-random-key-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Security
PASSWORD_MIN_LENGTH=8
SETUP_DATABASE_KEY=your-setup-secret-key (leave empty in production)

# CORS (comma-separated)
CORS_ORIGINS_STR=https://active-hq.vercel.app,https://localhost:5173

# WhatsApp (Interakt)
INTERAKT_API_KEY=your-api-key
INTERAKT_TEMPLATE_RENEWAL=template-code-name
INTERAKT_TEMPLATE_PAYMENT_DUE=template-code-name-2

# SMS Fallback (Twilio)
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token

# Monitoring
SENTRY_DSN=https://xxxxx@sentry.io/project-id
ENVIRONMENT=production

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=app-password

# Cron
CRON_SECRET=secret-for-cron-endpoint
```

### Frontend (.env.local)

```bash
# API URL
VITE_API_URL=https://activehq-api.onrender.com  # Production
# or
VITE_API_URL=http://localhost:8000  # Local dev
```

---

## 📝 Common Commands

### Backend

```bash
# Migrations
alembic revision --autogenerate -m "description"  # Create migration
alembic upgrade head  # Apply all migrations
alembic downgrade -1  # Rollback last

# Seed data
python scripts/seed_data.py

# Tests
pytest -v
pytest --cov=app

# Lint/format
black app/  # Format code
flake8 app/  # Check style
```

### Frontend

```bash
# Dev
npm run dev  # Start dev server
npm run build  # Build for production
npm run preview  # Preview production build

# Testing
npm run test:e2e  # E2E tests
npm run lint  # ESLint

# Type checking
npm run typecheck  # TypeScript check
```

---

## 🎯 Deployment Checklist

Before pushing to production:

- [ ] All tests pass locally (`pytest`, `npm run test:e2e`)
- [ ] No TypeScript errors (`npm run build`)
- [ ] No ESLint warnings  
- [ ] Environment variables set (DATABASE_URL, JWT_SECRET_KEY, etc.)
- [ ] Database migrations tested locally
- [ ] Sentry DSN configured
- [ ] CORS origins include Vercel domain
- [ ] Frontend API URL points to production API
- [ ] Health checks passing
- [ ] No sensitive data in logs

---

## 📞 Quick Support

| Issue | Solution |
|-------|----------|
| Database connection error | Check DATABASE_URL format and credentials |
| 401 Unauthorized | Check JWT_SECRET_KEY matches between deploy |
| 403 Forbidden | Check CORS_ORIGINS_STR includes your domain |
| Tests timeout | Slow machine? Increase timeout: `pytest --timeout=30` |
| E2E fails to find element | Check frontend is running (`npm run dev`) |
| Migrations not running | Check entrypoint.sh has execute permission (`chmod +x`) |
| Sentry not capturing errors | Check SENTRY_DSN is set and has a project |

---

**Last Updated:** March 21, 2026  
**For Questions:** See docs/ directory for detailed guides

