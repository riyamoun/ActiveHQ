# ActiveHQ Domain + Integrations Runbook

## Target setup (recommended)

| Component | Platform | Public URL |
|---|---|---|
| Frontend | Vercel | `https://activehq.fit` (+ `https://www.activehq.fit`) |
| Backend API | Render | `https://api.activehq.fit` |
| Database | Render managed Postgres | internal |

---

## 1) Domain (GoDaddy) → Vercel (frontend)

In **Vercel** → Project → **Settings** → **Domains**:
- Add `activehq.fit`
- Add `www.activehq.fit`

In **GoDaddy DNS**:
- **A** record
  - **Name**: `@`
  - **Value**: `76.76.21.21`
- **CNAME** record
  - **Name**: `www`
  - **Value**: `cname.vercel-dns.com`

Vercel will verify and issue HTTPS automatically.

---

## 2) Domain (GoDaddy) → Render (backend API)

In **Render** → your API service → **Settings** → **Custom Domains**:
- Add `api.activehq.fit`

Render will show a DNS target. In **GoDaddy DNS** create:
- **CNAME**
  - **Name**: `api`
  - **Value**: `<your-render-service-host>.onrender.com` (Render will show the exact target)

Wait for Render to verify; HTTPS will be issued automatically.

---

## 3) Backend environment variables (Render)

Set these in Render → Service → **Environment**:

- **DATABASE_URL**: from Render Postgres
- **JWT_SECRET_KEY**: strong random string
- **ENVIRONMENT**: `production`
- **DEBUG**: `false`
- **CORS_ORIGINS_STR**: comma-separated, **no spaces**  
  Example:

```text
https://activehq.fit,https://www.activehq.fit
```

### WhatsApp (Interakt)
- **INTERAKT_API_KEY**
- **INTERAKT_COUNTRY_CODE**: `+91`
- **INTERAKT_TEMPLATE_RENEWAL**
- **INTERAKT_TEMPLATE_PAYMENT_DUE**

### SMS fallback (Twilio) (optional)
- **TWILIO_ACCOUNT_SID**
- **TWILIO_AUTH_TOKEN**
- **TWILIO_SMS_FROM** (Twilio number in E.164, e.g. `+91...` if supported)
- **TWILIO_WHATSAPP_FROM** (Twilio WhatsApp sender, if used)

### Cron (automation)
- **CRON_SECRET**: random secret

Then schedule (Render Cron / external) a daily call:
- `GET /api/v1/automation/run-cron?secret=<CRON_SECRET>`

This runs:
- renewal reminders
- dues followups
- inactivity nudges (7-day default)

---

## 4) Frontend environment variables (Vercel)

In Vercel → Project → **Settings** → **Environment Variables**:

- **VITE_API_URL**:

```text
https://api.activehq.fit
```

- **VITE_APP_URL**:

```text
https://activehq.fit
```

Deploy again after setting these.

---

## 5) Biometric (eSSL) integration (production)

### The reality
The eSSL device is on **LAN**. It will not push to cloud by itself.

So we run a **local agent** (Python script) on a gym PC (same Wi‑Fi/LAN as the device):

`Device (LAN) → Agent → ActiveHQ API (cloud) → DB`

### 5.1 Create device + generate token (in ActiveHQ)

1. Create device (manager/owner login) via dashboard or API:
   - `POST /api/v1/biometric/devices`
2. Rotate and copy ingest token:
   - `POST /api/v1/biometric/devices/{device_id}/token`
   - Save the returned `ingest_token` securely (shown once).

### 5.2 Member mapping (critical)

ActiveHQ matches device punches using:

- `BiometricEvent.person_identifier` ↔ `Member.member_code`

So set each member’s `member_code` to the device’s `user_id` (e.g. `4`).

### 5.3 Run the agent on gym PC

On the gym PC:

```bash
cd backend
python -m pip install -r scripts/biometric_agent_requirements.txt
```

Set env vars and run:

```bash
DEVICE_IP=192.168.1.11
DEVICE_PORT=4370
EXTERNAL_DEVICE_ID=essl-x2008-1
ACTIVEHQ_API_BASE=https://api.activehq.fit
ACTIVEHQ_BIOMETRIC_TOKEN=<token>

python scripts/biometric_agent.py
```

Agent pushes to:
- `POST /api/v1/biometric/events/ingest-device`
  with header `X-Biometric-Token: <token>`

---

## 6) Quick validation checklist

- **Frontend** loads on `activehq.fit`
- **Backend** responds on `api.activehq.fit/health`
- **CORS**: login works from `activehq.fit`
- **Automation cron**: returns JSON (200) when called with `CRON_SECRET`
- **Biometric agent**: prints “pushed N events”
- **Dashboard**: attendance counts change after punches

