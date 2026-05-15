# ActiveHQ — Developer Notes (Pratyush)

> Keep this file updated as you work. Any AI agent can read this to get up to speed instantly.

---

## Environment Setup

| Service | Command | URL |
|---------|---------|-----|
| PostgreSQL (Docker) | `DOCKER_HOST=unix://$HOME/.colima/docker.sock docker-compose up -d` | localhost:5432 |
| Backend (FastAPI) | `cd backend && source venv/bin/activate && uvicorn app.main:app --reload` | http://localhost:8000 |
| Frontend (React/Vite) | `cd frontend && npm run dev` | http://localhost:3002 |
| API Docs (Swagger) | Auto-available when backend is running | http://localhost:8000/docs |

**Note:** Docker on this machine uses Colima. Always prefix docker commands with `DOCKER_HOST=unix://$HOME/.colima/docker.sock`

## Demo Credentials
- Owner: `owner@fitzonegym.com` / `Owner@123`
- Manager: `manager@fitzonegym.com` / `Staff@123`

---

## Git Branches

| Branch | Purpose | Status |
|--------|---------|--------|
| `main` | Production code, do not touch directly | Stable |
| `feature/whatsapp-expiry-reminders` | WhatsApp reminders feature | ✅ Pushed, PR pending |
| `feature/biometric-face-recognition` | Biometric face check-in | 🔄 Not started yet |

**Workflow:** Always work on feature branches. Never commit directly to `main`. Open a PR when done.

---

## Feature 1: WhatsApp Expiry Reminders ✅

**Branch:** `feature/whatsapp-expiry-reminders`  
**Status:** Code complete, pushed to GitHub, awaiting PR merge

### What was built
- Post-expiry WhatsApp reminders (sends 1 reminder/day for 30 days after subscription expires)
- Pre-expiry reminders were already in the codebase (7 days before)
- Uses **Picky Assist** as WhatsApp/SMS provider

### Files changed
- `backend/app/models/enums.py` — Added `EXPIRY_FOLLOWUP` trigger type
- `backend/app/automation/cron_runner.py` — Added `run_expiry_followup_automation()`
- `backend/app/automation/send_service.py` — Added trigger mapping
- `backend/app/automation/reminder_list.py` — Added `expired` section
- `backend/scripts/seed_data.py` — Seeds 3 default campaigns
- `backend/alembic/versions/20260514_add_expiry_followup.py` — DB migration

### Pending: Picky Assist credentials
The Picky Assist account (`+91 93543 49118`) has NO API token and NO WhatsApp channel connected yet.
Steps needed:
1. Login to app.pickyassist.com → Settings → Developers → API → Create API Token → copy it
2. Go to Channels → Connect WhatsApp Business API → get channel ID
3. Add to `backend/.env`:
   ```
   PICKYASSIST_API_TOKEN=<token>
   PICKYASSIST_APPLICATION_WHATSAPP=<channel_id>
   ```

---

## Feature 2: Biometric Face Recognition 🔄

**Branch:** `feature/biometric-face-recognition`  
**Status:** Planning phase — waiting for device API details from project lead

### What's decided
- Gym will use **dedicated face punch-in devices** at the door (like existing fingerprint devices)
- Device does face recognition locally, pushes events to ActiveHQ API
- **Soft block**: Expired members get rejected at check-in but face data stays in DB
- Architecture is same as existing `BiometricDevice` / `BiometricEvent` flow

### What needs to be built
- Add `FACE` device vendor to `DeviceVendor` enum
- Add subscription check in `BiometricService._apply_event_to_attendance()` — block expired members
- Add `BLOCKED_SUBSCRIPTION_EXPIRED` conflict reason
- New `BiometricEventStatus.BLOCKED` status
- DB migration for new enum values
- (Later, when device API received): device-specific integration

### What already exists (no changes needed)
- `backend/app/biometric/` — full device registry, event ingestion, attendance processing
- `backend/app/models/biometric_device.py` — device model
- `backend/app/models/device_user_mapping.py` — maps device face IDs to members

---

## Key Architecture Notes

- **Multi-tenancy:** Every DB query is scoped by `gym_id`. Use `TenantDep` in all routers.
- **Auth:** JWT tokens, short-lived (15 min). Refresh tokens: 7 days.
- **Picky Assist:** WhatsApp + SMS provider. Codebase already integrated — just needs API keys.
- **Cron:** Daily automation runs via `GET /api/v1/automation/run-cron?secret=<CRON_SECRET>`
  - Local test secret: `dev-cron-secret-123` (set in `.env`)
- **Migrations:** Always run `alembic upgrade head` after pulling changes that include new migrations.
