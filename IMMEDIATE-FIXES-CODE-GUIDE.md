# ⚡ ACTIVEHQ: IMMEDIATE FIXES & CODE SOLUTIONS

## Quick Reference: Copy-Paste Ready Solutions

---

## 1️⃣ PAGINATION LIMIT FIX (4 hours)

### Step 1: Create constants file

**File:** `backend/app/core/constants.py` (NEW)

```python
from enum import IntEnum

class PaginationConfig(IntEnum):
    """Pagination limits to prevent DoS"""
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 1000
    MAX_RESULTS = 5000

class QueryLimits:
    """Hard limits on various queries"""
    MEMBERS_MAX = 5000
    PAYMENTS_MAX = 10000
    ATTENDANCE_MAX = 50000
    REPORTS_MAX = 100000
```

### Step 2: Update members router

**File:** `backend/app/members/router.py`

Replace this:
```python
@router.get("/members")
def list_members(
    current_user: CurrentUserDep,
    db: DbDep,
    skip: int = 0,
    limit: int = Query(default=100),
):
    return db.query(Member).filter(
        Member.gym_id == current_user.gym_id
    ).offset(skip).limit(limit).all()
```

With this:
```python
from app.core.constants import PaginationConfig

class PaginationResponse(BaseModel):
    items: List[MemberOut]
    total: int
    skip: int
    limit: int
    pages: int

@router.get("/members", response_model=PaginationResponse)
def list_members(
    current_user: CurrentUserDep,
    db: DbDep,
    skip: int = Query(0, ge=0, description="Records to skip"),
    limit: int = Query(
        PaginationConfig.DEFAULT_PAGE_SIZE,
        ge=1,
        le=PaginationConfig.MAX_PAGE_SIZE,
        description=f"Max {PaginationConfig.MAX_PAGE_SIZE} per page"
    ),
):
    """List gym members with pagination"""
    # Get total count
    total = db.query(Member).filter(
        Member.gym_id == current_user.gym_id
    ).count()
    
    # Get paginated results
    items = db.query(Member).filter(
        Member.gym_id == current_user.gym_id
    ).order_by(Member.created_at.desc()).offset(skip).limit(limit).all()
    
    # Calculate pages
    pages = (total + limit - 1) // limit
    
    return PaginationResponse(
        items=items,
        total=total,
        skip=skip,
        limit=limit,
        pages=pages
    )
```

### Step 3: Repeat for other endpoints

Apply same pattern to:
- `GET /payments`
- `GET /attendance`
- `GET /memberships`
- `GET /biometric/events`
- `GET /automation/campaigns`

### Step 4: Update frontend

**File:** `frontend/src/pages/MembersPage.tsx`

```typescript
import { useState } from 'react';
import { memberService } from '@/services/memberService';
import { useQuery } from '@tanstack/react-query';

interface PaginationState {
    page: number;
    limit: number;
}

export function MembersPage() {
    const [pagination, setPagination] = useState<PaginationState>({
        page: 1,
        limit: 20,
    });

    const skip = (pagination.page - 1) * pagination.limit;

    const { data, isLoading, error } = useQuery({
        queryKey: ['members', skip, pagination.limit],
        queryFn: () =>
            memberService.listMembers({
                skip,
                limit: pagination.limit,
            }),
    });

    if (isLoading) return <LoadingSpinner />;
    if (error) return <ErrorMessage error={error} />;
    if (!data) return null;

    const maxPages = Math.ceil(data.total / pagination.limit);

    return (
        <div>
            <h1>Members ({data.total} total)</h1>

            {/* Member list */}
            <table className="w-full">
                <tbody>
                    {data.items.map((member) => (
                        <tr key={member.id}>
                            <td>{member.first_name} {member.last_name}</td>
                            <td>{member.phone_number}</td>
                            <td>{member.plan?.name}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Pagination controls */}
            <div className="mt-4 flex items-center gap-4">
                <button
                    disabled={pagination.page === 1}
                    onClick={() =>
                        setPagination({
                            ...pagination,
                            page: pagination.page - 1,
                        })
                    }
                >
                    Previous
                </button>

                <span>
                    Page {pagination.page} of {maxPages}
                </span>

                <button
                    disabled={pagination.page === maxPages}
                    onClick={() =>
                        setPagination({
                            ...pagination,
                            page: pagination.page + 1,
                        })
                    }
                >
                    Next
                </button>

                {/* Items per page selector */}
                <select
                    value={pagination.limit}
                    onChange={(e) =>
                        setPagination({
                            page: 1,
                            limit: parseInt(e.target.value),
                        })
                    }
                >
                    <option value={20}>20 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                </select>
            </div>
        </div>
    );
}
```

---

## 2️⃣ REQUEST TIMEOUT FIX (3 hours)

### Backend: Add timeouts to all external calls

**File:** `backend/app/services/messaging_service.py`

```python
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential
from app.core.logger import logger
from app.core.config import settings

class MessagingService:
    REQUEST_TIMEOUT = 30  # seconds
    MAX_RETRIES = 3
    
    def __init__(self):
        self.httpx_client = httpx.Client(
            timeout=self.REQUEST_TIMEOUT,
            limits=httpx.Limits(max_connections=100)
        )
    
    @retry(
        stop=stop_after_attempt(MAX_RETRIES),
        wait=wait_exponential(multiplier=1, min=1, max=10)
    )
    def send_whatsapp(self, phone: str, message: str) -> dict:
        """Send WhatsApp with retry logic"""
        try:
            response = self.httpx_client.post(
                settings.PICKYASSIST_API_URL,
                json={
                    "to": phone,
                    "message": message,
                    "type": "text"
                },
                headers=self.headers,
                timeout=self.REQUEST_TIMEOUT
            )
            response.raise_for_status()
            return response.json()
        except httpx.TimeoutException as e:
            logger.error(f"WhatsApp API timeout for {phone}")
            raise
        except httpx.HTTPError as e:
            logger.error(f"WhatsApp API error: {str(e)}")
            raise
    
    @retry(
        stop=stop_after_attempt(MAX_RETRIES),
        wait=wait_exponential(multiplier=1, min=1, max=10)
    )
    def send_sms(self, phone: str, message: str) -> dict:
        """Send SMS with timeout and retry"""
        try:
            response = self.httpx_client.post(
                settings.SMS_API_URL,
                json={
                    "phone": phone,
                    "message": message
                },
                timeout=self.REQUEST_TIMEOUT
            )
            response.raise_for_status()
            return response.json()
        except httpx.TimeoutException:
            logger.error(f"SMS API timeout for {phone}")
            raise
        except httpx.HTTPError as e:
            logger.error(f"SMS API error: {str(e)}")
            raise
```

### Frontend: Add timeout to axios

**File:** `frontend/src/services/axios.ts`

```typescript
import axios, {
    AxiosError,
    AxiosInstance,
    InternalAxiosRequestConfig,
} from 'axios';
import { authStore } from '@/store/authStore';
import { toast } from 'react-hot-toast';

const REQUEST_TIMEOUT = 30000; // 30 seconds

const api: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    timeout: REQUEST_TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = authStore.getState().accessToken;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        // Handle timeout
        if (error.code === 'ECONNABORTED') {
            toast.error('Request timeout - please try again');
            return Promise.reject(error);
        }

        // Handle 401 - Refresh token
        if (error.response?.status === 401) {
            const { refreshToken } = authStore.getState();
            if (refreshToken) {
                try {
                    const response = await axios.post(
                        `${import.meta.env.VITE_API_URL}/api/v1/auth/refresh`,
                        { refresh_token: refreshToken },
                        { timeout: REQUEST_TIMEOUT }
                    );

                    const { access_token, refresh_token } = response.data;
                    authStore.getState().setTokens(access_token, refresh_token);

                    // Retry original request
                    if (error.config) {
                        error.config.headers.Authorization = `Bearer ${access_token}`;
                        return api(error.config);
                    }
                } catch (refreshError) {
                    authStore.getState().logout();
                    toast.error('Session expired. Please login again.');
                }
            }
        }

        // Handle other errors
        if (error.response?.status === 429) {
            toast.error('Too many requests. Please wait a moment.');
        } else if (error.response?.status === 500) {
            toast.error('Server error. Please try again later.');
        }

        return Promise.reject(error);
    }
);

export default api;
```

### Update requirements.txt

```
tenacity>=8.2.0
```

---

## 3️⃣ DATABASE INDEXES (2 hours)

### Add indexes to models

**File:** `backend/app/models/models.py`

```python
from sqlalchemy import Index, Table, Column, String, UUID, DateTime, Float
from datetime import datetime

class Member(Base):
    __tablename__ = "members"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    gym_id = Column(UUID(as_uuid=True), ForeignKey("gyms.id"), nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String)
    phone_number = Column(String(20), nullable=False)
    status = Column(String, default="ACTIVE")
    joined_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Critical indexes
    __table_args__ = (
        Index('idx_member_gym_status', 'gym_id', 'status'),
        Index('idx_member_gym_phone', 'gym_id', 'phone_number'),
        Index('idx_member_gym_joined', 'gym_id', 'joined_date'),
        Index('idx_member_name_search', 'first_name', 'last_name'),
        Index('idx_member_created', 'created_at'),
    )


class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    gym_id = Column(UUID(as_uuid=True), ForeignKey("gyms.id"), nullable=False)
    member_id = Column(UUID(as_uuid=True), ForeignKey("members.id"))
    amount = Column(Float, nullable=False)
    status = Column(String, default="COMPLETED")
    payment_date = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index('idx_payment_gym_date', 'gym_id', 'payment_date'),
        Index('idx_payment_gym_status', 'gym_id', 'status'),
        Index('idx_payment_member', 'member_id'),
    )


class Attendance(Base):
    __tablename__ = "attendance"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    gym_id = Column(UUID(as_uuid=True), ForeignKey("gyms.id"), nullable=False)
    member_id = Column(UUID(as_uuid=True), ForeignKey("members.id"), nullable=False)
    check_in_time = Column(DateTime, default=datetime.utcnow)
    check_out_time = Column(DateTime)
    
    __table_args__ = (
        Index('idx_attendance_gym_date', 'gym_id', 'check_in_time'),
        Index('idx_attendance_member', 'member_id'),
        Index('idx_attendance_member_date', 'member_id', 'check_in_time'),
    )
```

### Create migration

```bash
cd backend
alembic revision --autogenerate -m "add_missing_indexes"
```

### Verify indexes

```sql
-- Connect to database
psql -U postgres activehq

-- List indexes
\d members;
\d payments;
\d attendance;

-- Analyze query plan
EXPLAIN ANALYZE
SELECT * FROM members 
WHERE gym_id = 'xyz' AND status = 'ACTIVE'
LIMIT 20;
```

---

## 4️⃣ FORM DEBOUNCING (2 hours)

### Create custom hook

**File:** `frontend/src/hooks/useDebounce.ts` (NEW)

```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number = 500): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Set timer
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Clear timer on next change or unmount
        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}
```

### Apply to search

**File:** `frontend/src/pages/MembersPage.tsx`

```typescript
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import { memberService } from '@/services/memberService';

export function MembersPage() {
    const [searchInput, setSearchInput] = useState('');
    const debouncedSearch = useDebounce(searchInput, 500); // Wait 500ms

    const { data: members, isLoading } = useQuery({
        queryKey: ['members', 'search', debouncedSearch],
        queryFn: async () => {
            if (debouncedSearch.length < 2) return [];
            return memberService.search(debouncedSearch);
        },
        enabled: debouncedSearch.length >= 2, // Only search if 2+ chars
    });

    return (
        <div>
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Search members (min 2 chars)..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                />
                {searchInput !== debouncedSearch && (
                    <p className="text-sm text-gray-500 mt-1">Searching...</p>
                )}
            </div>

            {isLoading && debouncedSearch && <p>Loading...</p>}

            {debouncedSearch && members?.length === 0 && (
                <p className="text-gray-500">No members found</p>
            )}

            {members && (
                <div className="space-y-2">
                    {members.map((member) => (
                        <div
                            key={member.id}
                            className="p-3 border rounded hover:bg-gray-50 cursor-pointer"
                        >
                            {member.first_name} {member.last_name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
```

### Monitor API calls

```typescript
// Track actual API call count
let apiCallCount = 0;

export function memberSearch(query: string) {
    apiCallCount++;
    console.log(`API Call #${apiCallCount}`);
    // ...search logic
}
```

**Result:** Without debounce = 10 API calls for "john smith" (1 per char)
With debounce = 1 API call (after user stops typing)

---

## 5️⃣ SENTRY ERROR TRACKING (1 hour)

### Backend setup

**File:** `backend/app/core/config.py`

```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

class Settings:
    SENTRY_DSN: str = os.getenv("SENTRY_DSN", "")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    APP_VERSION: str = "1.0.0"

if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        integrations=[
            FastApiIntegration(),
            SqlalchemyIntegration(),
        ],
        traces_sample_rate=0.1,  # Sample 10% of requests
        environment=settings.ENVIRONMENT,
        release=settings.APP_VERSION,
        before_send=lambda event, hint: event,  # Optional filtering
    )
```

### Frontend setup

**File:** `frontend/src/main.tsx`

```typescript
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
        new BrowserTracing({
            routingInstrumentation:
                Sentry.reactRouterV6Instrumentation(
                    window.history
                ),
        }),
    ],
    tracesSampleRate: 0.1,
    environment: import.meta.env.MODE,
    release: "1.0.0",
});

const SentryRoutes = Sentry.withSentryRouting(Routes);

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Sentry.ErrorBoundary
            fallback={<ErrorFallback />}
            showDialog
        >
            <App />
        </Sentry.ErrorBoundary>
    </React.StrictMode>,
);
```

### Environment variables

```bash
# .env.production
SENTRY_DSN=https://xxxxx@sentry.io/12345678
VITE_SENTRY_DSN=https://xxxxx@sentry.io/12345678
```

### Test error tracking

```python
# backend/app/admin/router.py
@router.post("/test-error")
def test_error():
    """Test Sentry integration"""
    try:
        1 / 0  # Intentional error
    except Exception as e:
        sentry_sdk.capture_exception(e)
        raise

# Frontend
<button onClick={() => {
    Sentry.captureException(new Error('Test error'));
}}>
    Test Error
</button>
```

---

## 6️⃣ RATE LIMITING TESTS (2 hours)

**File:** `backend/tests/test_rate_limiting.py` (NEW)

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app
import time

client = TestClient(app)

def test_registration_rate_limit():
    """Verify 5 registrations per minute limit"""
    base_email = "testuser{i}@example.com"
    
    # First 5 should succeed
    for i in range(5):
        response = client.post(
            "/api/v1/auth/register",
            json={
                "gym_name": f"Gym {i}",
                "owner_email": base_email.format(i=i),
                "owner_password": "ValidPassword123"
            }
        )
        assert response.status_code == 201, f"Registration {i+1} failed"
    
    # 6th should be rate limited (429)
    response = client.post(
        "/api/v1/auth/register",
        json={
            "gym_name": "Gym 6",
            "owner_email": "testuser6@example.com",
            "owner_password": "ValidPassword123"
        }
    )
    assert response.status_code == 429
    assert "Too many requests" in response.json()["detail"]

def test_login_rate_limit(test_user):
    """Verify 10 login attempts per minute"""
    for i in range(10):
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user.email,
                "password": "wrong_password"
            }
        )
        # Status can be 401 (wrong password) but request should go through
        assert response.status_code in [401, 429]
    
    # 11th should be rate limited
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": test_user.email,
            "password": "wrong_password"
        }
    )
    assert response.status_code == 429

def test_rate_limit_headers(client):
    """Verify rate limit headers returned"""
    response = client.get(
        "/api/v1/members",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Should have rate limit headers
    assert "X-RateLimit-Limit" in response.headers
    assert "X-RateLimit-Remaining" in response.headers
    assert "X-RateLimit-Reset" in response.headers

# Run tests
# pytest tests/test_rate_limiting.py -v
```

---

## 7️⃣ QUICK WINS SUMMARY

| Fix | File | Time | Impact |
|-----|------|------|--------|
| Pagination | `members/router.py` | 1h | 🟢 Critical |
| Timeouts | `services/*.py` | 1h | 🟢 Critical |
| Indexes | `models/*.py` | 1h | 🟡 High |
| Debouncing | `hooks/useDebounce.ts` | 0.5h | 🟡 High |
| Sentry | `core/config.py` | 0.5h | 🟡 High |
| Rate Limit Tests | `tests/test_rate_limiting.py` | 0.5h | 🟡 High |

**Total Time:** ~5 hours  
**Total Impact:** 🟢 Production ready for 100+ users

---

## 🔗 INTEGRATION CHECKLIST

After implementing each fix:

```bash
# 1. Verify syntax
python -m py_compile backend/app/members/router.py

# 2. Run tests
cd backend && pytest tests/ -v

# 3. Check coverage
pytest --cov=app tests/

# 4. Type checking
mypy backend/app/

# 5. Lint code
flake8 backend/app/ --max-line-length=100

# 6. Local test
cd backend && uvicorn app.main:app --reload

# 7. Test endpoints
curl -X GET "http://localhost:8000/api/v1/members" \
  -H "Authorization: Bearer <token>"
```

---

End of Code Solutions Guide
