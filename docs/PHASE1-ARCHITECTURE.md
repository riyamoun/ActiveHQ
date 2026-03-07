# Phase 1: Production-Ready Core — Architecture Lock

## Current Stack (Answer: A)

**Backend:** **FastAPI** + SQLAlchemy 2.0 + PostgreSQL  
**Frontend:** React (Vite) + TypeScript + Tailwind — *not* Next.js; public/dashboard separation is via routes and layouts.

No shortcuts. This doc locks auth, permissions, and structure.

---

## 1. Auth System (Production Level)

### 1.1 JWT Strategy

| Token        | Lifetime | Purpose                          |
|-------------|----------|-----------------------------------|
| Access      | **15 min** | API calls; short-lived, reduce risk |
| Refresh     | **7 days** | Issue new access without re-login   |

- **Verify JWT** on every protected request.
- **Extract `sub`** (user id) → load `User` → **inject `gym_id`** into request context.
- **No cross-gym access**: all tenant queries filter by `gym_id` from the token’s user.

### 1.2 Role Model (RBAC)

| Role          | Scope      | Use case                          |
|---------------|------------|------------------------------------|
| `super_admin` | Platform   | Future platform ops; not gym-scoped |
| `owner`       | Gym        | Gym owner (same as “gym_owner”)    |
| `manager`     | Gym        | Manager                            |
| `staff`       | Gym        | Front-desk / staff                 |

Backend enum: `UserRole`: `OWNER`, `MANAGER`, `STAFF` (+ `SUPER_ADMIN` for future).

### 1.3 Gym-Scoped Middleware (Request Flow)

```
Request → Extract Bearer token → decode_jwt()
        → validate type=access, exp
        → load User by sub
        → load Gym by user.gym_id, ensure is_active
        → inject TenantContext(user, gym) into handler
        → handler uses only tenant.gym_id for DB filters
```

Implemented via FastAPI **dependencies**: `get_current_user` → `get_tenant_context`. No handler receives a raw token; they receive `User` or `TenantContext` scoped to one gym.

---

## 2. Authorization (Permission Matrix)

Enforced in backend with role dependencies:

| Action           | Owner | Manager | Staff |
|------------------|-------|---------|-------|
| Add Member       | ✅    | ✅      | ❌    |
| Edit Member      | ✅    | ✅      | ❌    |
| Delete Member    | ✅    | ❌      | ❌    |
| View Payments    | ✅    | ✅      | ✅    |
| Record Payment   | ✅    | ✅      | ✅    |
| Edit Pricing     | ✅    | ❌      | ❌    |
| View Reports     | ✅    | ✅      | ✅    |
| Export Reports   | ✅    | ✅      | ❌    |
| Gym Settings     | ✅    | ❌*     | ❌    |
| Biometric/Config | ✅    | ✅      | ❌    |

\* Manager may have limited settings; sensitive (billing, plan) = Owner only.

**Implementation:** `require_owner`, `require_manager_or_above`, `require_staff_or_above` from `app.auth.dependencies`; each protected route declares the required dependency.

---

## 3. Backend Structure (Current = Modular)

```
backend/
├── app/
│   ├── main.py
│   ├── core/
│   │   ├── config.py      # Settings, JWT timing, CORS, DB URL
│   │   ├── security.py    # JWT create/decode, bcrypt
│   │   ├── database.py
│   │   ├── exceptions.py
│   ├── auth/              # Login, register, refresh, RBAC deps
│   ├── gyms/
│   ├── members/
│   ├── plans/
│   ├── memberships/
│   ├── payments/
│   ├── attendance/
│   ├── reports/
│   ├── public/            # Demo request, lead capture
│   ├── biometric/         # Device registry + ingest
│   ├── automation/        # Campaigns + delivery
│   ├── models/            # SQLAlchemy models
├── alembic/
├── tests/
```

No separate `repositories/` layer yet; services use Session and tenant `gym_id` for all queries.

---

## 4. Security Checklist

- **Passwords:** bcrypt (configurable rounds).
- **CORS:** Allow list from env; no wildcard in production.
- **Input:** Pydantic on all request bodies/path/query.
- **SQL:** SQLAlchemy ORM only; no raw SQL with user input.
- **Login:** Rate limiting on `POST /auth/login` (e.g. per-IP or per-email).
- **Audit:** Payment creation records `created_at` and `received_by` (user who recorded it). Expand to a full payment audit log table (e.g. `payment_audit_log`) when required for compliance.

---

## 5. JWT Config (Exact)

In `app.core.config` (and `.env`):

- `ACCESS_TOKEN_EXPIRE_MINUTES=15`
- `REFRESH_TOKEN_EXPIRE_DAYS=7`
- `JWT_SECRET_KEY` = strong secret in production (env only).
- `JWT_ALGORITHM=HS256`

Token payload:

- Access: `sub` (user id), `exp`, `type: "access"`.
- Refresh: `sub`, `exp`, `type: "refresh"` (and optionally `jti` for revocation later).

---

## 6. Development Plan (Weeks 1–4)

- **Week 1:** Auth + Gym + Users (registration, JWT, roles, tenant context).
- **Week 2:** Members + Plans + Memberships.
- **Week 3:** Payments + Attendance + Reports.
- **Week 4:** UI polish, testing, deployment.

Hardware (e.g. eSSL) and fancy automation come **after** this core is locked and deployed.
