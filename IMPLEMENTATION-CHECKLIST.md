# 🛠️ ACTIVEHQ: IMPLEMENTATION CHECKLIST & TESTING GUIDE

---

## WEEK 1: QUICK WINS (Stability)

### Day 1: Pagination Limits

**Files to modify:**
- [ ] `backend/app/core/constants.py` — Create (NEW)
- [ ] `backend/app/members/router.py` — Update all GET list endpoints
- [ ] `backend/app/payments/router.py` — Add pagination
- [ ] `backend/app/attendance/router.py` — Add pagination
- [ ] `backend/app/memberships/router.py` — Add pagination
- [ ] `frontend/src/services/memberService.ts` — Handle pagination response
- [ ] `frontend/src/pages/MembersPage.tsx` — Add pagination UI

**Checklist:**
```bash
# Test pagination
curl -X GET "http://localhost:8000/api/v1/members?skip=0&limit=20" \
  -H "Authorization: Bearer <token>"

# Verify response format
{
  "items": [...],
  "total": 150,
  "skip": 0,
  "limit": 20,
  "pages": 8
}

# Test limits are enforced
curl -X GET "http://localhost:8000/api/v1/members?limit=5000" \
  # Should return 400 or adjust to max 1000
```

**Command:**
```bash
cd backend && pytest tests/test_pagination.py -v
```

---

### Day 2: Request Timeouts

**Files to modify:**
- [ ] `backend/requirements.txt` — Add `tenacity>=8.2.0`
- [ ] `backend/app/services/messaging_service.py` — Add timeout to httpx calls
- [ ] `backend/app/services/email_service.py` — Add timeout to SMTP
- [ ] `frontend/src/services/axios.ts` — Add timeout to all requests

**Test:**
```python
# backend/tests/test_timeout.py
def test_external_api_timeout(client, test_user, mocker):
    """Verify timeout handling"""
    mocker.patch(
        'httpx.AsyncClient.post',
        side_effect=httpx.TimeoutException()
    )
    
    response = client.post(
        "/api/v1/automation/campaigns/send",
        json={"campaign_id": "test"},
        headers={"Authorization": f"Bearer {test_user.token}"}
    )
    
    # Should return 504 or retry message, not hang
    assert response.status_code in [202, 504]
```

---

### Day 3: Database Indexes

**Files to modify:**
- [ ] `backend/app/models/models.py` — Add `__table_args__` to models
- [ ] Create new migration: `alembic revision --autogenerate -m "add_indexes"`

**Verify:**
```sql
-- Check indexes exist
\d members;
\d attendance;
\d payments;
```

**Test performance:**
```python
# backend/tests/test_query_performance.py
import time

def test_members_query_performance(db):
    """List members with 10K records"""
    # Create 10K members
    for i in range(10000):
        Member.create(
            gym_id=test_gym.id,
            phone=f"999{i:07d}"
        )
    
    start = time.time()
    members = db.query(Member).filter(
        Member.gym_id == test_gym.id,
        Member.status == "ACTIVE"
    ).limit(100).all()
    duration = time.time() - start
    
    # Should complete in <100ms with index
    assert duration < 0.1
    print(f"Query took {duration*1000:.1f}ms")
```

---

### Day 4: Rate Limiting Tests

**Files to create:**
- [ ] `backend/tests/test_rate_limiting.py` (NEW)

**Test code:**
```python
import pytest
from fastapi.testclient import TestClient

def test_registration_rate_limit(client):
    """Verify 5/minute limit on registration"""
    for i in range(5):
        response = client.post(
            "/api/v1/auth/register",
            json={
                "gym_name": f"Gym {i}",
                "owner_email": f"owner{i}@example.com",
                "owner_password": "ValidPassword123"
            }
        )
        assert response.status_code == 201
    
    # 6th request should be rate limited
    response = client.post(
        "/api/v1/auth/register",
        json={
            "gym_name": "Gym 6",
            "owner_email": "owner6@example.com",
            "owner_password": "ValidPassword123"
        }
    )
    assert response.status_code == 429
    assert "Too many requests" in response.json()["detail"]

def test_login_rate_limit(client, test_user):
    """Verify 10/minute limit on login"""
    for i in range(10):
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user.email,
                "password": "wrong_password"
            }
        )
        # Status doesn't matter, just check request goes through
        assert response.status_code in [401, 200]
    
    # 11th request should be rate limited
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": test_user.email,
            "password": "wrong_password"
        }
    )
    assert response.status_code == 429
```

**Run tests:**
```bash
cd backend && pytest tests/test_rate_limiting.py -v
```

---

### Day 5: Setup Monitoring (Sentry)

**Installation:**
```bash
cd backend && pip install sentry-sdk[fastapi]
cd frontend && npm install @sentry/react @sentry/tracing
```

**Backend setup:**
```python
# backend/app/core/config.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        integrations=[FastApiIntegration()],
        traces_sample_rate=0.1,  # Sample 10% of requests
        environment=settings.ENVIRONMENT,
        release=settings.APP_VERSION
    )

# backend/app/main.py
from sentry_sdk import capture_exception

@app.middleware("http")
async def log_requests(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        capture_exception(e)
        raise
```

**Frontend setup:**
```typescript
// frontend/src/main.tsx
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
        new BrowserTracing(),
        new Sentry.Replay(),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
});

const SentryApp = Sentry.withProfiler(App);

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <SentryApp />
    </React.StrictMode>,
);
```

**Verify:**
```bash
# Send test event
curl -X POST "http://localhost:8000/api/v1/admin/test-error" \
  -H "Authorization: Bearer <token>"

# Check Sentry dashboard for event
```

---

## WEEK 2-3: CRITICAL FIXES (Performance)

### Days 6-8: Redis Caching

**Setup Redis:**
```bash
docker run -d -p 6379:6379 redis:7-alpine

# Test connection
redis-cli ping  # Should return PONG
```

**Installation:**
```bash
cd backend && pip install redis>=5.0.0
```

**Verification:**
```python
# backend/tests/test_cache.py
import pytest
from app.core.cache import cache_manager

@pytest.mark.asyncio
async def test_member_list_caching(db, test_user):
    """Verify cache is used"""
    cache_key = f"members:{test_user.gym_id}:0:20"
    
    # First call - cache miss
    result1 = await memberService.list_members(
        gym_id=test_user.gym_id,
        use_cache=True
    )
    
    # Check cache was populated
    cached = await cache_manager.get(cache_key)
    assert cached is not None
    
    # Second call - cache hit
    result2 = await memberService.list_members(
        gym_id=test_user.gym_id,
        use_cache=True
    )
    
    # Results should be identical
    assert result1 == result2

@pytest.mark.asyncio
async def test_cache_invalidation(db, test_user):
    """Verify cache is invalidated on update"""
    # Create member (populate cache)
    result1 = await memberService.list_members(test_user.gym_id)
    count1 = len(result1["items"])
    
    # Add new member
    await memberService.create_member(
        gym_id=test_user.gym_id,
        phone="9999999999"
    )
    
    # Cache should be invalidated
    result2 = await memberService.list_members(test_user.gym_id)
    count2 = len(result2["items"])
    
    assert count2 == count1 + 1
```

**Load test cache:**
```bash
# Install load testing tool
pip install locust

# Create locustfile.py
from locust import HttpUser, task

class ActiveHQUser(HttpUser):
    @task
    def view_members(self):
        self.client.get(
            "/api/v1/members",
            headers={"Authorization": f"Bearer {token}"}
        )

# Run load test
locust -f locustfile.py --host=http://localhost:8000
# Access http://localhost:8089
```

---

### Days 9-11: Celery Async Tasks

**Setup:**
```bash
# Start Redis (if not already running)
redis-cli  # Should connect

# Install Celery
cd backend && pip install celery>=5.3.0

# Create worker
celery -A app.core.celery worker --loglevel=info

# Create scheduler
celery -A app.core.celery beat --loglevel=info
```

**Verification:**
```python
# backend/tests/test_async_tasks.py
import pytest
from app.core.celery import send_whatsapp_task

@pytest.mark.asyncio
async def test_whatsapp_task_queued(db, test_user, mocker):
    """Verify task is queued, not blocking"""
    mocker.patch('app.core.celery.send_whatsapp_task.delay')
    
    # Send should return immediately
    response = await automationService.send_campaign(
        campaign_id="test",
        gym_id=test_user.gym_id
    )
    
    # Should return task IDs, not wait for delivery
    assert "celery_task_ids" in response
    assert len(response["celery_task_ids"]) > 0

def test_celery_worker_processes_tasks(celery_worker):
    """Verify worker actually sends messages"""
    task = send_whatsapp_task.delay(
        phone="919876543210",
        message="Test message"
    )
    
    # Wait for task completion (max 10 seconds)
    result = task.get(timeout=10)
    
    assert result["status"] == "sent"
    assert result["phone"] == "919876543210"
```

---

### Days 12-14: 2FA Implementation

**Database migration:**
```bash
cd backend && alembic revision --autogenerate -m "add_2fa_columns"
```

**Installation:**
```bash
pip install pyotp>=2.9.0 cryptography>=41.0.0
```

**Test:**
```python
# backend/tests/test_2fa.py
def test_enable_2fa_setup(client, test_user):
    """Verify 2FA setup flow"""
    response = client.post(
        "/api/v1/auth/2fa/setup",
        json={"password": "ValidPassword123"},
        headers={"Authorization": f"Bearer {test_user.token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "qr_code" in data
    assert "backup_codes" in data
    assert len(data["backup_codes"]) == 10

def test_login_with_2fa(client, test_user_with_2fa):
    """Verify login with 2FA enabled"""
    # Step 1: Email + password
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": test_user_with_2fa.email,
            "password": "ValidPassword123"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["requires_2fa"] is True
    pending_token = data["pending_token"]
    
    # Step 2: Verify 2FA code
    totp = pyotp.TOTP(test_user_with_2fa.two_fa_secret)
    code = totp.now()
    
    response = client.post(
        "/api/v1/auth/2fa/verify",
        json={
            "pending_token": pending_token,
            "code": code
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
```

---

## WEEK 4: OPTIMIZATION

### Days 15-17: Bundle Optimization

**Analyze bundle:**
```bash
cd frontend && npm run build
# Install visualizer
npm install -D rollup-plugin-visualizer
# Run build and view report
npm run build -- --analyze
```

**Implement code splitting:**
```bash
# Add lazy loading to routes
npm run build

# Check bundle sizes
gzip -l dist/assets/*.js
```

**Test performance:**
```bash
# Lighthouse audit
npm install -g lighthouse
lighthouse https://activehq.fit --view
```

---

### Days 18-20: Load Testing

**Create comprehensive load test:**
```python
# backend/load_test.py
from locust import HttpUser, task, between
import random

class GymOwnerUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        # Login first
        response = self.client.post(
            "/api/v1/auth/login",
            json={
                "email": "owner@fitzonegym.com",
                "password": "Owner@123"
            }
        )
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    @task(3)
    def view_members(self):
        self.client.get(
            "/api/v1/members",
            headers=self.headers
        )
    
    @task(2)
    def view_payments(self):
        self.client.get(
            "/api/v1/payments",
            headers=self.headers
        )
    
    @task(1)
    def view_reports(self):
        self.client.get(
            "/api/v1/reports/dashboard",
            headers=self.headers
        )
```

**Run load test:**
```bash
locust -f load_test.py --host=http://localhost:8000
# Open http://localhost:8089
# Set number of users to 100
# Monitor response times and errors
```

---

## POST-DEPLOYMENT CHECKLIST

### Security Audit
- [ ] Run security scan: `pip install bandit && bandit -r backend/app/`
- [ ] Check dependencies: `pip-audit`
- [ ] Verify rate limiting works
- [ ] Test 2FA flow end-to-end
- [ ] Verify JWT tokens expire correctly
- [ ] Check password reset flow

### Performance Validation
- [ ] Database query response times < 100ms
- [ ] Frontend Lighthouse score > 80
- [ ] API response time p95 < 500ms
- [ ] Cache hit ratio > 80%
- [ ] Celery task success rate > 99%

### Monitoring Setup
- [ ] Sentry configured and receiving errors
- [ ] Database monitoring active
- [ ] Alert rules created for:
  - [ ] Error rate > 1%
  - [ ] Response time p95 > 1s
  - [ ] Database connections > 80%
  - [ ] Redis memory > 80%
  - [ ] Celery task failures > 5%

### Documentation
- [ ] API endpoints documented (OpenAPI/Swagger)
- [ ] Deployment runbook created
- [ ] Disaster recovery plan
- [ ] Monitoring dashboard screenshots
- [ ] Known limitations documented

---

## PERFORMANCE BENCHMARKS (Target)

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Homepage Load Time | < 2s | ? | 🟡 TBD |
| Dashboard API Response | < 500ms | ? | 🟡 TBD |
| Members List (100 items) | < 200ms | ? | 🟡 TBD |
| Member Search | < 300ms | ? | 🟡 TBD |
| Report Generation | < 5s | ? | 🟡 TBD |
| Concurrent Users Supported | 100+ | ? | 🟡 TBD |
| Email Send Latency | < 5s async | ? | 🟡 TBD |
| Database Query p95 | < 100ms | ? | 🟡 TBD |

**Measure baseline:**
```bash
# Create benchmark script
# backend/benchmark.py
import time
from locust import HttpUser, task

class Benchmark(HttpUser):
    def on_start(self):
        self.timings = {}
    
    def on_quit(self):
        avg = sum(self.timings.values()) / len(self.timings)
        print(f"Average response: {avg*1000:.1f}ms")

# Run and measure
locust -f benchmark.py --headless -u 1 -r 1 --run-time 60s
```

---

## ROLLBACK PLAN

If something breaks in production:

**Database:**
```bash
# Restore from backup
pg_restore --clean --if-exists -d activehq backup.dump

# Or rollback migration
cd backend && alembic downgrade -1
```

**Code:**
```bash
# Revert to previous commit
git revert <commit-hash>
git push

# Render automatically redeploys
```

**Redis:**
```bash
# Flush cache if corrupted
redis-cli FLUSHALL

# Rebuild on next request
```

**Secrets:**
```bash
# If compromised, rotate immediately
export JWT_SECRET_KEY="new-strong-secret"
# Invalidate all existing tokens
```

---

## SUCCESS CRITERIA

✅ **Week 1:** Pagination, timeouts, indexes, monitoring working  
✅ **Week 2:** Redis cache hit rate > 80%  
✅ **Week 3:** Celery tasks 99%+ success, 2FA enabled for all users  
✅ **Week 4:** Frontend bundle < 200KB gzip, 100 concurrent users supported  
✅ **Post-Deploy:** 0 critical errors, P95 response time < 500ms  

---

## SUPPORT & ESCALATION

| Issue | Action | Owner | Timeline |
|-------|--------|-------|----------|
| API Errors | Check Sentry → Investigate → Hotfix | Backend Lead | 1 hour |
| Slow Queries | Check monitoring → Optimize index → Deploy | DBA | 4 hours |
| High Memory | Check Redis size → Invalidate old cache | DevOps | 30 mins |
| Email Failures | Check Celery workers → Retry → Manual send | Backend | 2 hours |
| Security Alert | Follow incident response plan | Security | 15 mins |

---

Created: May 18, 2026  
Last Updated: TBD (When implementation starts)
