# Scaling for 100+ Gyms — What’s in Place

## Done (High Priority)

### 1. DB-backed refresh tokens
- **Table:** `refresh_tokens` (id, user_id, token_hash, expires_at, revoked, created_at)
- **Flow:** Login → create row; Refresh → revoke old, create new; Logout → revoke by token
- **Endpoint:** `POST /api/v1/auth/logout` (body: `{ "refresh_token": "..." }`)
- Prevents replay, multi-device abuse, stolen token use

### 2. Audit log
- **Table:** `audit_logs` (id, gym_id, user_id, action, entity_type, entity_id, old_data, new_data, created_at)
- **Service:** `app.services.audit_service.log(db, gym_id=..., user_id=..., action=..., entity_type=..., ...)`
- Payment create is audited; wire `audit_log()` for other critical actions (member delete, plan change, etc.)

### 3. Healthchecks
- **GET /health** — Liveness (API up)
- **GET /health/ready** — Readiness (API + DB); returns **503** if DB down (for LB/k8s)
- **GET /health/detailed** — Diagnostics (api + database status)

### 4. Pagination
- **Members:** already paginated
- **Payments:** already paginated
- **Memberships:** already paginated
- **Attendance:** already paginated
- **Plans:** added page, page_size (default 20, max 100)
- **Users:** added page, page_size (default 20, max 100)
- **Reports:** expiring-members, members-with-dues — added page, page_size (max 500)

### 5. Production Dockerfile
- **Path:** `backend/Dockerfile`
- **Runtime:** Gunicorn + Uvicorn workers
- **Env:** `GUNICORN_WORKERS`, `GUNICORN_TIMEOUT`, `GUNICORN_MAX_REQUESTS`
- **Healthcheck:** hits `/health`
- Build: `docker build -t activehq-api ./backend`
- Run: `docker run -p 8000:8000 --env-file backend/.env activehq-api`

---

## Already in Place

- **Multi-tenancy:** All queries scoped by `gym_id` (tenant context)
- **Indexes:** members (gym_id, phone), memberships (gym_id, status, end_date), attendance (gym_id, check_in_time), payments (gym_id, payment_date), users (gym_id, email)

---

## Render (Current)

**API (Render):** https://activehq-api.onrender.com  
**Frontend (Vercel):** https://vercel.com/riyamouns-projects/active-hq → production URL will be e.g. `https://active-hq.vercel.app` or your custom domain.

You’re on **Render** (API) + **Vercel** (frontend). The stack is aligned with that:

- **PORT:** The API binds to `0.0.0.0:${PORT}`. Render sets `PORT` (e.g. 10000); local Docker uses 8000.
- **Health:** Use **Health Check Path** ` /health` in the Render dashboard (or `healthCheckPath: /health` in `render.yaml`). Optional: **Readiness** can hit `/health/ready` if you add a custom check.
- **Blueprint:** Repo root has **`render.yaml`** so you can use a Blueprint (new or existing). It defines:
  - Web service from `backend/Dockerfile` (Docker context: `./backend`).
  - Env vars: `DATABASE_URL` from the linked DB, `JWT_SECRET_KEY` (generated), `ENVIRONMENT`, `DEBUG`, `CORS_ORIGINS_STR` (set in Dashboard), token expiry.
  - **Database:** You already have **`activehq-db`** (PostgreSQL). Link it via **DATABASE_URL** in the API service.  
  - **Important:** Render free Postgres **expires** (e.g. after 90 days) and is then deleted. For production and 100+ gyms, **upgrade `activehq-db` to a paid plan before the expiry date** (e.g. March 4, 2026) so data is not lost. Paid plans have no expiry and backups.
- **CORS (required for Vercel frontend):** In Render → **activehq-api** service → **Environment**, set **CORS_ORIGINS_STR** to your Vercel frontend origin(s), comma-separated, e.g.  
  `https://active-hq.vercel.app,https://active-hq-riyamouns-projects.vercel.app`  
  (Add your exact Vercel deployment URL from the Vercel project; add a custom domain here too if you use one.)
- **Migrations:** Run Alembic after deploy (e.g. in a one-off shell or a pre-deploy script):  
  `cd backend && alembic upgrade head`  
  Or use a **background worker** or **script** that runs migrations on deploy if you add it.

---

### Vercel (frontend) + Render (API) checklist

| Where | What to set |
|-------|-------------|
| **Vercel** → Project **active-hq** → Settings → Environment Variables | **VITE_API_URL** = `https://activehq-api.onrender.com` (Production). Redeploy after adding. |
| **Render** → **activehq-api** service → Environment | **CORS_ORIGINS_STR** = your Vercel production URL, e.g. `https://active-hq.vercel.app` (and any preview/custom domains you need). |

Without `VITE_API_URL` on Vercel, the frontend will call `/api/v1` (same origin) and get 404. Without CORS on Render, the browser will block requests from the Vercel domain.

---

## WhatsApp (Interakt) + SMS fallback (first gym)

- **WhatsApp:** Interakt (India). Set `INTERAKT_API_KEY`, `INTERAKT_TEMPLATE_RENEWAL`, `INTERAKT_TEMPLATE_PAYMENT_DUE` on Render. Create matching templates in [Interakt](https://app.interakt.ai/templates/list) with body variables {{1}}, {{2}}, {{3}} (renewal: member_name, days_until_expiry, end_date; payment: member_name, amount_due, end_date).
- **SMS fallback:** Optional Twilio. Set `TWILIO_*` if you want SMS when WhatsApp fails.
- **Flow:** Campaigns → Interakt template API (or Twilio free-form if Interakt not configured) → log in `notifications` and `campaign_delivery_logs`.
- **Cron:** `GET /api/v1/automation/run-cron?secret=<CRON_SECRET>` daily. Set `CRON_SECRET` on Render.
- **Full steps:** See **`docs/ONBOARDING-FIRST-GYM.md`** (Interakt, domain activehq.fit, biometric).
