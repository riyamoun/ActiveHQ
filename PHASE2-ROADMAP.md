# PHASE 2: Feature Expansion & Scaling — Roadmap (Weeks 2-4)

**Timeline:** March 28 — April 18, 2026  
**Goal:** Add advanced features and prepare for multi-gym scaling  

---

## Priority 1: SMS & Notifications (1 week)

### Task 1a: SMS Fallback Testing
**Files:** `backend/app/services/messaging.py`

```python
# Test Twilio fallback when WhatsApp fails
async def send_notification(member_id: str, message: str):
    # Try WhatsApp first (Interakt)
    # Fall back to SMS (Twilio) if Interakt fails
    # Log both attempts
```

**Tests:**
- [ ] Twilio SMS sends successfully
- [ ] WhatsApp → SMS fallback works
- [ ] Failed sends logged for retry
- [ ] Opt-out support (don't spam)

### Task 1b: Email Notifications
**Files:** `backend/app/services/email_service.py`, `backend/app/auth/router.py`

```python
# Send email on:
# - Member registration confirmation
# - Payment receipts
# - Membership renewal upcoming
# - Password reset
```

**Setup:** Use SMTP (GoDaddy/Gmail app password)

---

## Priority 2: Frontend Advanced Features (1.5 weeks)

### Task 2a: Advanced Filtering & Search
**Files:** `frontend/src/pages/members/MembersPage.tsx`

```tsx
// Filter by:
// - Phone (exact + fuzzy)
// - Status (active, expired, pending)
// - Membership type
// - Joined date range
// - Custom fields
```

**Components:**
- FilterBar component (reusable)
- SearchInput with debouncing
- URL-based filters (shareable links)

### Task 2b: Bulk Member Import
**Files:** `frontend/src/pages/members/ImportPage.tsx`

```tsx
// CSV import:
// - name, phone, email, date_of_birth, membership_type, start_date
// - Validation, error reporting, progress bar
// - Async job tracking
```

**Backend:** `backend/app/members/router.py`
```python
@router.post("/bulk-import")
async def bulk_import(file: UploadFile, tenant: TenantDep):
    # Parse CSV
    # Validate each row
    # Create members + memberships
    # Return summary
```

### Task 2c: Dark Mode
**Files:** `frontend/src/store/themeStore.ts`, `frontend/src/App.tsx`

```tsx
// Zustand store for theme
// Tailwind dark mode class toggle
// localStorage persistence
```

---

## Priority 3: Admin & Monitoring (1 week)

### Task 3a: Super Admin Panel
**Files:** `frontend/src/pages/admin/`, Backend: `app/admin/`

```tsx
// Routes:
// - /admin/gyms — All gyms, subscription status, last activity
// - /admin/users — All users, role mapping, activity logs
// - /admin/analytics — Platform-wide metrics
// - /admin/support — Demo requests, escalations
```

**Permissions:** Require ROLE == SUPER_ADMIN from JWT

### Task 3b: Cron Job UI & Monitoring
**File:** `frontend/src/pages/automation/CronMonitor.tsx`

```tsx
// Show:
// - Last run time
// - Next scheduled run
// - Messages sent/failed
// - Manual trigger button
// - Activity log
```

**Backend:** `backend/app/automation/router.py`
```python
@router.post("/run-cron-manual")  # Owner/Manager only
async def run_cron_manual(tenant: TenantDep):
    # Trigger renewal + payment reminders immediately
    # Return summary
```

---

## Priority 4: Advanced Reporting (1 week)

### Task 4a: Attendance Heatmap
**Files:** `frontend/src/components/reports/AttendanceHeatmap.tsx`

```tsx
// Calendar heatmap showing check-ins per day
// Color intensity = check-in count
// Hover for details
```

### Task 4b: Revenue Breakdown
**Files:** `frontend/src/components/reports/RevenueBreakdown.tsx`

```tsx
// Pie/bar chart: Revenue by plan, method (cash/UPI)
// Trend line: Daily/weekly revenue over time
// CSV export of raw data
```

### Task 4c: Member Lifetime Value (LTV)
**Files:** `frontend/src/pages/reports/MemberLTVPage.tsx`

```tsx
// Calculate & display:
// - Total revenue per member
// - Average LTV by cohort
// - Churn rate
// - Retention segments
```

**Backend:** `backend/app/reports/service.py`
```python
def get_member_ltv(gym_id: str, member_id: str = None):
    # Sum all payments
    # Calculate retention time
    # Return LTV + trends
```

---

## Priority 5: Data & Compliance (Ongoing)

### Task 5a: GDPR Data Export
**Files:** `backend/app/compliance/`

```python
@router.get("/export-member-data/{member_id}")
async def export_member_data(gym_id, member_id):
    # Return JSON of all member data
    # Include payments, attendance, preferences
```

### Task 5b: Member Consent Management
**Files:** `backend/app/members/models.py`

```python
class MemberConsent(Base):
    member_id: int
    whatsapp_marketing: bool
    email_marketing: bool
    sms_marketing: bool
    data_retention: bool  # < 3 years auto-delete
    created_at: datetime
    updated_at: datetime
```

---

## Priority 6: Biometric Enhancements

### Task 6a: Conflict Resolution UI
**Files:** `frontend/src/pages/biometric/ConflictLog.tsx`

```tsx
// Show biometric conflicts:
// - Unknown member punches
// - Duplicate check-in windows
// - Time drift anomalies

// Manual resolution:
// - Assign punch to correct member
// - Ignore/delete punch
// - Flag as admin review
```

### Task 6b: Vendor Integrations
**Files:** `backend/app/biometric/vendors/`

```python
# Vendor-specific parsers:
# - ESSL (common in India)
# - ZKTeco
# - Generic REST API
# - CSV/Excel import
```

---

## Priority 7: Performance & Scaling

### Task 7a: Redis Caching
**Files:** `backend/app/core/cache.py`

```python
# Cache for 5 minutes:
# - Member list (gym_id)
# - Dashboard stats (gym_id)
# - Plans (gym_id)
# - Membership status (member_id)

# Invalidate on write (member update, payment, etc.)
```

### Task 7b: Database Indexes & Optimization
**Files:** `backend/alembic/versions/`

```sql
-- Add indexes for common queries:
CREATE INDEX idx_payment_member_date ON payments(member_id, payment_date);
CREATE INDEX idx_attendance_gym_date ON attendance(gym_id, check_in_time);
```

### Task 7c: Load Testing
**Tools:** Apache JMeter / k6

```javascript
// Test under load:
// - 100 concurrent users
// - Login, add member, check payment
// - Measure response times
// - Identify bottlenecks
```

---

## Priority 8: Two-Factor Authentication

### Task 8a: OTP Setup
**Files:** `backend/app/auth/otp.py`

```python
class OTPService:
    def generate_otp(self, user_id) -> str:
        # Generate 6-digit code
        # Store in Redis (5 min expiry)
        # Send via SMS/WhatsApp
    
    def verify_otp(self, user_id, code) -> bool:
        # Check code matches
        # Consume OTP
```

### Task 8b: 2FA Toggle
**Files:** `frontend/src/pages/settings/SettingsPage.tsx`

```tsx
// User setting: Enable 2FA
// Backend tracks: two_factor_enabled on User model
// Login flow checks and prompts for OTP
```

---

## Priority 9: Payment Gateway Integration

### Task 9a: Razorpay Integration
**Files:** `backend/app/payments/razorpay.py`

```python
# Create order on Razorpay
# Handle webhook for payment confirmation
# Auto-create Payment record on success
```

**Backend Routes:**
```python
@router.post("/api/v1/payments/razorpay/create-order")
@router.post("/api/v1/payments/razorpay/webhook")  # Webhook handler
```

---

## Implementation Schedule

| Week | Focus | Deliverable |
|------|-------|-------------|
| Week 1 (28-31 Mar) | SMS + Email | Notifications fully tested |
| Week 2 (1-7 Apr) | Filtering + Bulk Import | Advanced member management |
| Week 3 (8-14 Apr) | Admin panel + Cron UI | Gym/user management |
| Week 4+ (15+ Apr) | Reporting + Compliance | Advanced analytics |

---

## Testing Strategy

- **Unit Tests:** Add 20+ tests for new services
- **Integration Tests:** End-to-end SMS, email, import flows
- **E2E Tests:** Playwright for new UI pages
- **Load Tests:** k6 script for scaling validation

---

## Definition of Done (Per Task)

✅ Code complete + tests passing  
✅ Code review + approval  
✅ Documentation updated (README, docs/)  
✅ Deployed to staging  
✅ E2E tests pass  
✅ No Sentry errors  
✅ Performance baseline met  

---

**Next Steps:**  
1. Pick ONE priority (e.g., SMS Fallback Testing)
2. Create GitHub issues linked to this roadmap  
3. Assign to team members  
4. Track progress in project board  
5. Ship incrementally (don't wait for all)  

