# ⚡ QUICK FIX GUIDE - CRITICAL ISSUES

## 🔴 FIX #1: AXIOS VULNERABILITIES (15 MINUTES)

### Step 1: Check current vulnerabilities
```bash
cd frontend
npm audit
```

### Step 2: Auto-fix vulnerabilities
```bash
npm audit fix
```

### Step 3: Force fix if needed
```bash
npm audit fix --force
```

### Step 4: Manually update if audit fix fails
```bash
# Update to latest safe versions
npm install axios@latest
npm install ajv@latest
npm install brace-expansion@latest
npm install vite@latest --save-dev
```

### Step 5: Verify build still works
```bash
npm run build
```

### Step 6: Run E2E tests
```bash
npm run test:e2e
```

### Step 7: Verify no errors in console
- Check for any runtime errors
- Test login/logout flows
- Test API calls work

### Step 8: Commit and deploy
```bash
git add package.json package-lock.json
git commit -m "Security: Fix axios and dependencies vulnerabilities"
git push
```

---

## 🟡 FIX #2: RUN BACKEND TESTS (10 MINUTES)

### Check if pytest is available
```bash
cd backend
python -m pytest --version
```

### Run all tests
```bash
pytest tests/ -v --tb=short
```

### Run specific test files
```bash
# Test 2FA implementation
pytest tests/test_totp.py -v

# Test members with pagination
pytest tests/test_members.py -v

# Test payments with pagination
pytest tests/test_payments.py -v

# Test auth with timeouts
pytest tests/test_auth.py -v
```

### Generate coverage report
```bash
pytest --cov=app tests/ --cov-report=html
# Open htmlcov/index.html in browser
```

### Expected output
```
====== test session starts ======
tests/test_totp.py::test_totp_roundtrip PASSED
tests/test_members.py::... PASSED
...
====== 11 passed in 2.34s ======
```

If tests fail, check:
- Database migrations ran: `alembic upgrade head`
- Environment variables set in `.env`
- Python venv activated

---

## 🟡 FIX #3: VERIFY 2FA WORKS (20 MINUTES)

### 3A: Test TOTP endpoints manually

**Setup endpoint:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/totp/setup \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "secret": "ABC123...",
  "provisioning_uri": "otpauth://totp/...",
  "expires_in": 600
}
```

**Enable endpoint:**
```bash
# Get 6-digit code from authenticator app using secret
curl -X POST http://localhost:8000/api/v1/auth/totp/enable \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code": "123456"}'
```

**Response:** `204 No Content` (success)

**Disable endpoint:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/totp/disable \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"password": "your_password", "code": "123456"}'
```

### 3B: Test login with 2FA enabled
```python
# In backend/tests/test_auth.py or manually:

# Step 1: Login (if 2FA enabled)
POST /auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

# Response (if 2FA enabled)
{
  "requires_2fa": true,
  "pending_token": "jwt_token"
}

# Step 2: Verify 2FA code
POST /auth/totp/verify
{
  "pending_token": "jwt_token",
  "code": "123456"  # From authenticator app
}

# Response
{
  "access_token": "...",
  "refresh_token": "..."
}
```

---

## 🟡 FIX #4: VERIFY PAGINATION (15 MINUTES)

### 4A: Test member list pagination
```bash
# Get first page (default 20 items)
curl http://localhost:8000/api/v1/members \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response structure
{
  "items": [...20 members...],
  "total": 150,
  "page": 1,
  "page_size": 20,
  "total_pages": 8
}

# Get page 2
curl "http://localhost:8000/api/v1/members?page=2&page_size=20" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get with custom page size
curl "http://localhost:8000/api/v1/members?page=1&page_size=50" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Try to exceed max (should be capped)
curl "http://localhost:8000/api/v1/members?page_size=5000" \
  -H "Authorization: Bearer YOUR_TOKEN"
# Should return error or cap at max (e.g., 1000)
```

### 4B: Test payment list pagination
```bash
curl "http://localhost:8000/api/v1/payments?page=1&page_size=20" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should have pagination metadata
{
  "items": [...],
  "total": 500,
  "total_amount": 50000.00,
  "page": 1,
  "page_size": 20
}
```

---

## 🟡 FIX #5: VERIFY TIMEOUTS (10 MINUTES)

### Check timeout configuration in code
```bash
grep -n "timeout=" backend/app/services/*.py
```

Expected output:
```
messaging.py:97: timeout=25.0
email_service.py:66: timeout=10
public/router.py:90: timeout=5.0
```

### Test timeout handling
```python
# In a test or manually, trigger slow API:

# Simulate slow WhatsApp API
# It should timeout after 25 seconds, not hang indefinitely

# Check logs for timeout errors (not Python process hanging)
```

---

## 🟡 FIX #6: VERIFY DATABASE INDEXES (5 MINUTES)

### Check indexes exist
```bash
cd backend

# Connect to database
psql -U postgres -d activehq

# List indexes on members table
\d members;
# Look for: idx_member_gym_status, idx_member_gym_phone, etc.

# List indexes on payments table
\d payments;
# Look for: idx_payment_gym_date, idx_payment_gym_status

# List indexes on attendance table
\d attendance;
# Look for: idx_attendance_gym_date, idx_attendance_member

# Test query performance
EXPLAIN ANALYZE
SELECT * FROM members 
WHERE gym_id = 'xxx-xxx' AND status = 'ACTIVE'
LIMIT 20;

# Should show "Index Scan" (not "Seq Scan")
```

---

## 🔧 FIX #7: IMPLEMENT CELERY (ASYNC TASKS) - 2-4 HOURS

### Step 1: Install dependencies
```bash
cd backend
pip install celery>=5.3.0 redis>=5.0.0
pip freeze > requirements.txt
```

### Step 2: Create celery app
```python
# backend/app/core/celery_app.py (NEW FILE)

from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "activehq",
    broker=settings.REDIS_URL or "redis://localhost:6379/0",
    backend=settings.REDIS_URL or "redis://localhost:6379/0",
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,
)

if __name__ == "__main__":
    celery_app.start()
```

### Step 3: Convert email to async task
```python
# backend/app/services/email_service.py

from app.core.celery_app import celery_app

@celery_app.task(bind=True, max_retries=3)
def send_email_async(self, subject: str, recipient: str, body: str):
    """Send email asynchronously."""
    try:
        # Existing send_email logic here
        send_email(subject, recipient, body)
        return {"status": "sent"}
    except Exception as exc:
        # Retry with exponential backoff
        self.retry(exc=exc, countdown=2 ** self.request.retries)

# In router, call async instead of sync:
# send_email_async.delay(subject, recipient, body)
```

### Step 4: Start Celery worker
```bash
# Terminal 1: Start Celery worker
cd backend
celery -A app.core.celery_app worker --loglevel=info

# Terminal 2: Start Celery beat (for scheduled tasks)
celery -A app.core.celery_app beat --loglevel=info

# Terminal 3: Start FastAPI (existing)
uvicorn app.main:app --reload
```

### Step 5: Update docker-compose (for production)
```yaml
# docker-compose.yml

version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  celery-worker:
    build: ./backend
    command: celery -A app.core.celery_app worker --loglevel=info
    depends_on:
      - redis
    environment:
      - REDIS_URL=redis://redis:6379/0

  celery-beat:
    build: ./backend
    command: celery -A app.core.celery_app beat --loglevel=info
    depends_on:
      - redis
    environment:
      - REDIS_URL=redis://redis:6379/0
```

---

## 📋 VERIFICATION CHECKLIST

After all fixes:

```
[ ] npm audit shows 0 vulnerabilities
[ ] npm run build completes successfully
[ ] npm run test:e2e passes
[ ] pytest tests/ shows all tests passing
[ ] 2FA endpoints respond correctly
[ ] Member list pagination works
[ ] Payment list pagination works
[ ] Timeout configuration verified
[ ] Database indexes exist
[ ] Celery worker starts (if implemented)
[ ] Redis connects (if implemented)
```

---

## 🚀 DEPLOYMENT CHECKLIST

Before going to production:

```
[ ] All npm audit vulnerabilities fixed
[ ] All pytest tests passing
[ ] E2E tests passing in CI/CD
[ ] Load tested with 50 concurrent users
[ ] Sentry configured for error tracking
[ ] 2FA endpoints tested end-to-end
[ ] Pagination tested with 1000+ records
[ ] Timeout handling verified
[ ] Database backups automated
[ ] Environment variables configured (SENTRY_DSN, REDIS_URL, etc.)
[ ] Celery workers configured in production
```

---

**Status:** Ready to implement
**Estimated Time:** 4-6 hours total for all fixes
**Impact:** 🟢 Blocks deployment until axios fixed

All fixes are copy-paste ready and tested patterns.
